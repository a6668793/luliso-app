import { createContext,useContext,useEffect,useState,useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { api,authClient,bootstrap } from './lib';
import type { Pet,Status } from './shared';
type Context = {status:Status|null;session:Session|null;pets:Pet[];selected:string;select:(id:string)=>void;refresh:()=>Promise<void>;loading:boolean;error:string;reload:()=>void};
const AppContext=createContext<Context|null>(null);
export function Provider({children}:{children:ReactNode}){const [status,setStatus]=useState<Status|null>(null);const [session,setSession]=useState<Session|null>(null);const [pets,setPets]=useState<Pet[]>([]);const [selected,select]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [attempt,retry]=useState(0);
 useEffect(()=>{let live=true;let unsubscribe:(()=>void)|undefined;setLoading(true);setError('');bootstrap().then(async state=>{if(!live)return;setStatus(state);const client=authClient();if(client){const {data,error}=await client.auth.getSession();if(error)throw error;if(!live)return;setSession(data.session);const {data:listener}=client.auth.onAuthStateChange((_event,s)=>{setSession(s);});unsubscribe=()=>listener.subscription.unsubscribe();} }).catch(()=>{if(live)setError('暫時連不上小嚕的家，請再試一次。');}).finally(()=>{if(live)setLoading(false);});return()=>{live=false;unsubscribe?.();};},[attempt]);
 const refresh=useCallback(async()=>{if(!session){setPets([]);return;}const data=await api<Pet[]>('pets');setPets(data);select(current=>data.some(p=>p.id===current)?current:data[0]?.id||'');},[session]);
 useEffect(()=>{refresh().catch(e=>setError(e.message));},[refresh]);
 return <AppContext.Provider value={{status,session,pets,selected,select,refresh,loading,error,reload:()=>retry(n=>n+1)}}>{children}</AppContext.Provider>;
}
export function useApp(){const context=useContext(AppContext);if(!context)throw new Error('Missing provider');return context;}
