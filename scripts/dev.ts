import { createServer } from 'node:http';
import { loadEnv, createServer as createViteServer } from 'vite';
import type { VercelRequest,VercelResponse } from '@vercel/node';
import handler from '../api/index.js';
Object.assign(process.env,loadEnv('development',process.cwd(),''));
const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'});
const server=createServer(async(req,res)=>{if(req.url?.startsWith('/api/index')){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>100000){res.writeHead(413);res.end('{"error":"請求過大"}');return;}}let parsed:unknown;try{parsed=body?JSON.parse(body):{};}catch{res.writeHead(400);res.end('{"error":"格式錯誤"}');return;}Object.assign(req,{body:parsed});const response=Object.assign(res,{status(code:number){res.statusCode=code;return response;},json(value:unknown){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));return response;}});await handler(req as VercelRequest,response as VercelResponse);}else vite.middlewares(req,res);});
server.listen(5173,'127.0.0.1',()=>console.log('LULISO ready at http://localhost:5173'));
