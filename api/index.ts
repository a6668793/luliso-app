import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import OpenAI from 'openai';
import { analysisInput, petInput, uploadInput, type Media, type Pet } from '../src/shared.js';
import { authenticate, configured, checkDb, HttpError, quota } from '../server/core.js';
import { analyse, chat } from '../server/ai.js';
import { backupFile, deleteBackup, driveCheck, driveConfigured } from '../server/drive.js';
const uuid=z.string().uuid();
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 try{
  const url=new URL(req.url||'/', 'http://localhost');const action=url.searchParams.get('action')||'status';const method=req.method||'GET';
  if(action==='status'&&method==='GET')return res.json({version:'1.0.0-beta.1',supabaseUrl:process.env.SUPABASE_URL||null,supabaseAnonKey:process.env.SUPABASE_ANON_KEY||null,database:configured(),ai:!!process.env.OPENAI_API_KEY,drive:driveConfigured()?'configured':'disconnected'});
  if(!['GET','POST','PATCH','DELETE'].includes(method))throw new HttpError(405,'不支援的操作。');
  if(method!=='GET'&&req.headers.origin&&process.env.APP_ORIGIN&&req.headers.origin!==process.env.APP_ORIGIN)throw new HttpError(403,'無法從此來源送出請求。');
  if(Number(req.headers['content-length']||0)>100000)throw new HttpError(413,'請直接上傳媒體，不要將檔案放入文字請求。');
  const {db,user}=await authenticate(req);const userId=user.id;
  const ownedPets=async(ids:string[])=>{const {data,error}=await db.from('pets').select('*').eq('user_id',userId).in('id',[...new Set(ids)]);checkDb(error);if(!data||data.length!==new Set(ids).size)throw new HttpError(404,'找不到這隻毛孩。');return data as Pet[];};
  const ownedMedia=async(ids:string[])=>{if(!ids.length)return [];const {data,error}=await db.from('media').select('*').eq('user_id',userId).eq('status','ready').in('id',[...new Set(ids)]);checkDb(error);if(!data||data.length!==new Set(ids).size)throw new HttpError(404,'檔案尚未完成上傳或無存取權。');return data as Media[];};
  if(action==='pets'){
   if(method==='GET'){const {data,error}=await db.from('pets').select('*').eq('user_id',userId).order('created_at');checkDb(error);return res.json(data);}
   if(method==='POST'||method==='PATCH'){const input=petInput.parse(req.body);await ownedMedia(input.photo_ids);let result;
    if(method==='POST'){const {count,error}=await db.from('pets').select('id',{head:true,count:'exact'}).eq('user_id',userId);checkDb(error);if((count||0)>=12)throw new HttpError(409,'Beta 最多可建立 12 隻毛孩。');result=await db.from('pets').insert({...input,user_id:userId}).select().single();}
    else {const id=uuid.parse(url.searchParams.get('id'));await ownedPets([id]);result=await db.from('pets').update({...input,personality:null}).eq('id',id).eq('user_id',userId).select().single();}
    checkDb(result.error);return res.json(result.data);
   }
   if(method==='DELETE'){const id=uuid.parse(url.searchParams.get('id'));await ownedPets([id]);const {error:a}=await db.from('analyses').delete().eq('user_id',userId).contains('pet_ids',[id]);checkDb(a);const {error}=await db.from('pets').delete().eq('id',id).eq('user_id',userId);checkDb(error);return res.json({ok:true});}
  }
  if(action==='upload'&&method==='POST'){
   const input=uploadInput.parse(req.body);const id=randomUUID();const ext:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','audio/wav':'wav','audio/mpeg':'mp3','audio/webm':'webm','audio/mp4':'m4a'};const path=`${userId}/${id}.${ext[input.mime]}`;
   const {data:reserved,error}=await db.rpc('reserve_media',{p_user:userId,p_id:id,p_path:path,p_mime:input.mime,p_size:input.size,p_duration:input.duration});checkDb(error);if(!reserved)throw new HttpError(409,'已達 Beta 儲存上限（100 MB），請先刪除不需要的媒體。');
   const {data,error:uploadError}=await db.storage.from('pet-media').createSignedUploadUrl(path);if(uploadError){await db.from('media').delete().eq('id',id).eq('user_id',userId);checkDb(uploadError);}return res.json({id,path,token:data!.token});
  }
  if(action==='upload-complete'&&method==='POST'){
   const id=uuid.parse(req.body.id);const {data:media,error}=await db.from('media').select('*').eq('id',id).eq('user_id',userId).single();checkDb(error);if(!media)throw new HttpError(404,'找不到媒體。');const {data:blob,error:downloadError}=await db.storage.from('pet-media').download(media.path);checkDb(downloadError);
   if(!blob||blob.size!==media.size||blob.size>20971520)throw new HttpError(400,'檔案大小驗證失敗。');
   const head=Buffer.from(await blob.slice(0,16).arrayBuffer());const mime=media.mime as string;let valid=false;
   if(mime==='image/jpeg')valid=head[0]===255&&head[1]===216&&head[2]===255;
   if(mime==='image/png')valid=head.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
   if(mime==='image/webp')valid=head.toString('ascii',0,4)==='RIFF'&&head.toString('ascii',8,12)==='WEBP';
   if(mime==='audio/wav')valid=head.toString('ascii',0,4)==='RIFF'&&head.toString('ascii',8,12)==='WAVE';
   if(mime==='audio/mpeg')valid=head.toString('ascii',0,3)==='ID3'||(head[0]===255&&(head[1]&224)===224);
   if(mime.endsWith('/mp4'))valid=head.toString('ascii',4,8)==='ftyp';
   if(mime.endsWith('/webm'))valid=head.subarray(0,4).equals(Buffer.from([26,69,223,163]));
   if(!valid)throw new HttpError(400,'檔案內容與格式不符。');
   const {error:finishError}=await db.from('media').update({status:'ready'}).eq('id',id).eq('user_id',userId);checkDb(finishError);return res.json({ok:true,id});
  }
  if(action==='media'){
   if(method==='GET'){const {data,error}=await db.from('media').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(200);checkDb(error);const entries=await Promise.all((data||[]).map(async m=>{if(m.status!=='ready')return m;const {data:signed,error:e}=await db.storage.from('pet-media').createSignedUrl(m.path,300);checkDb(e);return {...m,url:signed?.signedUrl};}));return res.json(entries);}
   if(method==='DELETE'){const id=uuid.parse(url.searchParams.get('id'));const {data:m,error}=await db.from('media').select('*').eq('id',id).eq('user_id',userId).single();checkDb(error);if(!m)throw new HttpError(404,'找不到檔案。');const {data:b,error:be}=await db.from('backups').select('*').eq('source_id',id).eq('user_id',userId);checkDb(be);for(const backup of b||[])await deleteBackup(backup.drive_file_id);const {error:se}=await db.storage.from('pet-media').remove([m.path]);checkDb(se);checkDb((await db.from('media').delete().eq('id',id).eq('user_id',userId)).error);checkDb((await db.from('backups').delete().eq('source_id',id).eq('user_id',userId)).error);return res.json({ok:true});}
  }
  if(action==='analyses'){
   if(method==='GET'){const {data,error}=await db.from('analyses').select('*').eq('user_id',userId).order('created_at',{ascending:false}).limit(50);checkDb(error);return res.json(data);}
   if(method==='POST'){const input=analysisInput.parse(req.body);const pets=await ownedPets(input.pet_ids);const media=await ownedMedia(input.media_ids);if(input.mode==='emotion'&&!media.some(m=>m.mime.startsWith('image/')))throw new HttpError(400,'請加入照片或抽取影片影格。');if(input.mode==='sound'&&!media.some(m=>['audio/wav','audio/mpeg'].includes(m.mime)))throw new HttpError(400,'請加入可分析的音訊。');
    await quota(db,userId);const files=await Promise.all(media.filter(m=>!m.mime.startsWith('video/')).map(async m=>{const {data,error}=await db.storage.from('pet-media').download(m.path);checkDb(error);if(!data||data.size>20971520)throw new HttpError(400,'媒體檔案無法讀取。');return {mime:m.mime,data:Buffer.from(await data.arrayBuffer())};}));
    const result=await analyse(input.mode,pets,input.context,files);const {data,error}=await db.from('analyses').insert({user_id:userId,mode:input.mode,pet_ids:input.pet_ids,context:input.context,result}).select().single();checkDb(error);
    if(input.mode==='personality'&&pets.length===1){checkDb((await db.from('pets').update({personality:result}).eq('id',pets[0].id).eq('user_id',userId)).error);}return res.json(data);
   }
  }
  if(action==='sessions'&&method==='GET'){const petId=uuid.parse(url.searchParams.get('pet'));await ownedPets([petId]);const {data,error}=await db.from('chat_sessions').select('*').eq('user_id',userId).eq('pet_id',petId).order('created_at',{ascending:false}).limit(50);checkDb(error);return res.json(data);}
  if(action==='messages'&&method==='GET'){const id=uuid.parse(url.searchParams.get('session'));const {data,error}=await db.from('messages').select('*').eq('user_id',userId).eq('session_id',id).order('created_at').limit(200);checkDb(error);return res.json(data);}
  if(action==='chat'&&method==='POST'){
   const input=z.object({pet_id:uuid,session_id:uuid.nullable(),question:z.string().trim().min(1).max(3000),consent:z.literal(true)}).parse(req.body);const [pet]=await ownedPets([input.pet_id]);let sessionId=input.session_id;
   if(sessionId){const {data,error}=await db.from('chat_sessions').select('id').eq('id',sessionId).eq('pet_id',pet.id).eq('user_id',userId).single();checkDb(error);if(!data)throw new HttpError(404,'找不到對話。');}
   await quota(db,userId);
   const {data:history,error}=sessionId?await db.from('messages').select('role,content').eq('user_id',userId).eq('session_id',sessionId).order('created_at',{ascending:false}).limit(20):{data:[],error:null};checkDb(error);
   const answer=await chat(pet,(history||[]).reverse() as {role:'user'|'assistant';content:string}[],input.question);
   if(!sessionId){const {data,error:e}=await db.from('chat_sessions').insert({user_id:userId,pet_id:pet.id,title:input.question.slice(0,40)}).select('id').single();checkDb(e);sessionId=data!.id;}
   const now=new Date();const {data,error:saveError}=await db.from('messages').insert([{user_id:userId,session_id:sessionId,role:'user',content:input.question,created_at:now.toISOString()},{user_id:userId,session_id:sessionId,role:'assistant',content:answer,created_at:new Date(now.getTime()+1).toISOString()}]).select();checkDb(saveError);return res.json({session_id:sessionId,messages:data});
  }
  if(action==='usage'&&method==='GET'){const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const {data,error}=await db.from('daily_usage').select('count').eq('user_id',userId).eq('day',day).maybeSingle();checkDb(error);return res.json({used:data?.count||0,limit:10});}
  if(action==='drive-status'&&method==='GET'){if(!driveConfigured())return res.json({connected:false,message:'未連線，主要資料保存在私有儲存空間。'});await driveCheck();return res.json({connected:true,message:'授權與資料夾隱私檢查通過。'});}
  if(action==='backup'&&method==='POST'){
   z.object({consent:z.literal(true)}).parse(req.body);await driveCheck();checkDb((await db.from('preferences').upsert({user_id:userId,drive_consent:true})).error);
   const {data:existing,error:ee}=await db.from('backups').select('source_id').eq('user_id',userId);checkDb(ee);const saved=new Set((existing||[]).map(b=>b.source_id));
   const {data:media,error:me}=await db.from('media').select('*').eq('user_id',userId).eq('status','ready');checkDb(me);
   const {data:reports,error:re}=await db.from('analyses').select('*').eq('user_id',userId);checkDb(re);
   const candidates=[...(media||[]).map(m=>({id:m.id,kind:'media',value:m})),...(reports||[]).map(a=>({id:a.id,kind:'report',value:a}))].filter(c=>!saved.has(c.id));
   let completed=0;for(const item of candidates.slice(0,2)){let bytes:Uint8Array;let mime:string;if(item.kind==='media'){const {data,error}=await db.storage.from('pet-media').download(item.value.path);checkDb(error);bytes=new Uint8Array(await data!.arrayBuffer());mime=item.value.mime;}else{bytes=new TextEncoder().encode(JSON.stringify(item.value));mime='application/json';}const driveId=await backupFile(`${userId}-${item.id}`,mime,bytes);const {error}=await db.from('backups').insert({user_id:userId,source_id:item.id,drive_file_id:driveId});if(error){await deleteBackup(driveId);checkDb(error);}completed++;}return res.json({completed,remaining:Math.max(0,candidates.length-completed)});
  }
  if(action==='account'&&method==='DELETE'){
   z.object({confirmation:z.literal('刪除我的所有資料')}).parse(req.body);if(!user.last_sign_in_at||Date.now()-Date.parse(user.last_sign_in_at)>15*60*1000)throw new HttpError(403,'為保護帳號，請先登出並重新登入，再於 15 分鐘內刪除。');
   const {data:backups,error:be}=await db.from('backups').select('*').eq('user_id',userId);checkDb(be);for(const b of backups||[])await deleteBackup(b.drive_file_id);
   const {data:media,error:me}=await db.from('media').select('path').eq('user_id',userId);checkDb(me);if(media?.length){const {error}=await db.storage.from('pet-media').remove(media.map(m=>m.path));checkDb(error);}
   const {error}=await db.auth.admin.deleteUser(userId);checkDb(error);return res.json({ok:true});
  }
  throw new HttpError(404,'找不到這項操作。');
 }catch(error){if(error instanceof z.ZodError)return res.status(400).json({error:error.issues[0]?.message||'請檢查輸入內容。'});if(error instanceof HttpError)return res.status(error.status).json({error:error.message});const providerError=z.object({status:z.number(),code:z.string().nullable().optional()}).safeParse(error);if(error instanceof OpenAI.APIError||providerError.success){const status=providerError.success?providerError.data.status:502;console.error('AI request failed',{status});return res.status(status===429?429:502).json({error:status===429?'AI 服務額度或流量暫時受限，請稍後再試。':'AI 服務暫時無法回應，請稍後重試。'});}console.error('Request failed',{type:error instanceof Error?error.name:'unknown'});return res.status(500).json({error:'小嚕遇到了一點狀況，請稍後重試。'});}
}
