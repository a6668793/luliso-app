import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { api, upload } from './lib';
import { imageFile } from './media';
import { Busy, Notice } from './components';
import type { Media } from './shared';

export default function PhotoPicker({ids,onChange,onBusyChange}:{ids:string[];onChange:(ids:string[])=>void;onBusyChange:(busy:boolean)=>void}) {
 const [urls,setUrls]=useState<Record<string,string>>({});
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const localUrls=useRef<string[]>([]);
 const uploading=useRef(false);
 useEffect(()=>{let active=true;api<Media[]>('media').then(items=>{if(active)setUrls(current=>({...Object.fromEntries(items.filter(m=>m.url).map(m=>[m.id,m.url!])),...current}));}).catch(()=>{if(active)setError('既有照片預覽暫時無法讀取，照片資料仍會保留。');});return()=>{active=false;};},[]);
 useEffect(()=>()=>{localUrls.current.forEach(url=>URL.revokeObjectURL(url));},[]);
 async function add(files:File[]) {
  if(uploading.current||!files.length)return;
  setError('');
  if(ids.length+files.length>5){setError(`最多 5 張正面照，目前還可以加入 ${5-ids.length} 張。`);return;}
  if(files.some(file=>!file.type.startsWith('image/')||file.size>20*1024*1024)){setError('請選擇照片，每張上限 20 MB。');return;}
  uploading.current=true;setBusy(true);onBusyChange(true);
  const next=[...ids];
  try {for(const file of files){const image=await imageFile(file);const id=await upload(image);const url=URL.createObjectURL(image);localUrls.current.push(url);setUrls(current=>({...current,[id]:url}));next.push(id);onChange([...next]);}}
  catch(e){setError(e instanceof Error?e.message:'照片上傳失敗，已成功的照片會保留。');}
  finally{uploading.current=false;setBusy(false);onBusyChange(false);}
 }
 return <div className="media-picker"><div className="upload-zone"><span className="upload-icon"><Camera size={29}/></span><h3>收藏牠可愛的正面照</h3><p>可一次選取多張，最多 5 張 · 每張上限 20 MB</p><div className="button-row"><label className="button secondary"><Upload size={17}/>選擇照片<input type="file" accept="image/*" multiple disabled={busy||ids.length>=5} hidden onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';void add(files);}}/></label><label className="button secondary"><Camera size={17}/>拍照<input type="file" accept="image/*" capture="environment" disabled={busy||ids.length>=5} hidden onChange={e=>{const files=Array.from(e.target.files||[]);e.target.value='';void add(files);}}/></label></div><p aria-live="polite">已加入 {ids.length}／5 張</p></div>{busy?<Busy text="正在安全上傳照片…"/>:null}{error?<Notice kind="error">{error}</Notice>:null}<div className="pet-photo-grid">{ids.map((id,i)=><div className="pet-photo-item" key={id}>{urls[id]?<img src={urls[id]} alt={`毛孩正面照 ${i+1}`}/>:<span>正面照 {i+1}</span>}<button type="button" className="icon-button" disabled={busy} aria-label={`移除正面照 ${i+1}`} onClick={()=>onChange(ids.filter(photo=>photo!==id))}><X size={18}/></button></div>)}</div><p className="fine">照片存放於私有空間。移除後請保存毛孩檔案；原始檔可至設定管理。</p></div>;
}
