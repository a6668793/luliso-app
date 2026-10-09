import { describe,it,expect } from 'vitest';
import { analysisInput,petInput,uploadInput } from '../src/shared';
import handler from '../api/index';
import type { VercelRequest,VercelResponse } from '@vercel/node';
const id='11111111-1111-4111-8111-111111111111';
describe('request validation',()=>{
 it('requires explicit AI consent',()=>{expect(analysisInput.safeParse({mode:'heart',pet_ids:[id],context:'hello',media_ids:[],consent:false}).success).toBe(false);});
 it('requires two pets for coexistence',()=>{expect(analysisInput.safeParse({mode:'coexist',pet_ids:[id],context:'hello',media_ids:[],consent:true}).success).toBe(false);});
 it('rejects sound analysis without media',()=>{expect(analysisInput.safeParse({mode:'sound',pet_ids:[id],context:'hello',media_ids:[],consent:true}).success).toBe(false);});
 it('requires behavioral information for personality profiles',()=>{expect(petInput.safeParse({name:'Mimi',species:'cat',birthday:null,sex:'unknown',breed:'',behavior:'',tags:[],photo_ids:[]}).success).toBe(false);});
 it('rejects oversized media and executable formats',()=>{expect(uploadInput.safeParse({mime:'image/png',size:30*1024*1024,duration:null}).success).toBe(false);expect(uploadInput.safeParse({mime:'image/svg+xml',size:100,duration:null}).success).toBe(false);});
 it('enforces video length',()=>{for(const duration of [null,2,16])expect(uploadInput.safeParse({mime:'video/mp4',size:100,duration}).success).toBe(false);expect(uploadInput.safeParse({mime:'video/mp4',size:100,duration:10}).success).toBe(true);});
});
describe('API authentication',()=>{
 it.each(['pets','media','analyses','messages','sessions','chat','upload','backup','account'])('rejects unauthenticated %s',async action=>{let code=200;let result:unknown;const req={url:`/api/index?action=${action}`,method:'POST',headers:{},body:{}};const res={setHeader(){},status(c:number){code=c;return this;},json(value:unknown){result=value;return this;}};await handler(req as VercelRequest,res as unknown as VercelResponse);expect(code).toBe(401);expect(result).toEqual({error:'請先登入，再和毛孩聊聊。'});});
 it('status never includes server secrets',async()=>{process.env.OPENAI_API_KEY='test-server-secret';let result:unknown;await handler({url:'/api/index?action=status',method:'GET',headers:{}} as VercelRequest,{setHeader(){},json(v:unknown){result=v;}} as unknown as VercelResponse);expect(JSON.stringify(result)).not.toContain('test-server-secret');delete process.env.OPENAI_API_KEY;});
});
