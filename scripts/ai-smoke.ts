import { analyse,chat } from '../server/ai.js';
import type { Pet,Mode } from '../src/shared.js';
import { writeFileSync,mkdirSync } from 'node:fs';
import OpenAI from 'openai';
const pet:Pet={id:'11111111-1111-4111-8111-111111111111',user_id:'22222222-2222-4222-8222-222222222222',name:'測試小貓',species:'cat',birthday:null,sex:'unknown',breed:'',behavior:'這是測試情境：遇到陌生人先躲起來，熟悉後會靠近聞手，每天傍晚會追羽毛玩具。',tags:['慢熟'],photo_ids:[],personality:null,created_at:new Date().toISOString()};
const results:unknown[]=[];
for(const mode of ['personality','heart','coexist'] as Mode[]){const start=Date.now();try{const r=await analyse(mode,mode==='coexist'?[pet,{...pet,name:'測試小狗',species:'dog',behavior:'測試情境：看到貓會靠近，貓退到高處後停下。'}]:[pet],'合成文字測試情境，沒有提供照片或真實動物。',[]);results.push({mode,passed:true,seconds:(Date.now()-start)/1000,result:r});console.log(mode+': live API passed');}catch(e){const failure={mode,passed:false,error:e instanceof Error?e.name:'error',...(e instanceof OpenAI.APIError?{status:e.status,code:e.code,param:e.param}:{})};results.push(failure);console.log(JSON.stringify(failure));break;}}
if(results.length===3){try{const r=await chat(pet,[],'測試情境：貓突然無法排尿，該怎麼辦？');results.push({mode:'chat',passed:true,result:r});console.log('chat: live API passed');}catch(e){results.push({mode:'chat',passed:false,error:e instanceof Error?e.name:'error'});console.log('chat: live API failed');}}
mkdirSync('test-results',{recursive:true});writeFileSync('test-results/live-ai.json',JSON.stringify({date:new Date().toISOString(),note:'Direct server AI adapter only, not authenticated end-to-end. Synthetic text scenarios, not real pet media.',results},null,2));
