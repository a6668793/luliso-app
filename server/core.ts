import { createClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export function configured(){return !!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY&&process.env.SUPABASE_SERVICE_ROLE_KEY);}
export function admin(){if(!configured())throw new HttpError(503,'帳號與資料庫尚未連線，請稍後再試。');return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function authenticate(req:VercelRequest){const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];if(!token)throw new HttpError(401,'請先登入，再和毛孩聊聊。');const db=admin();const {data,error}=await db.auth.getUser(token);if(error||!data.user)throw new HttpError(401,'登入已過期，請重新登入。');return {db,user:data.user};}
export function checkDb(error: {message:string}|null){if(error)throw new HttpError(503,'資料暫時無法存取，請稍後重試。');}
export async function quota(db:ReturnType<typeof admin>,user:string){const {data,error}=await db.rpc('take_ai_quota',{p_user:user});checkDb(error);if(!data)throw new HttpError(429,'今天的 10 次 AI 額度已用完，明天再來陪毛孩聊聊吧。');}
