import fs from 'node:fs';
import path from 'node:path';
const roots=['src','server','api','public','scripts','tests','supabase','.github'];
const files=['package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.json','vite.config.ts','eslint.config.js','index.html','.gitignore','.vercelignore','.env.example','vercel.json','README.md','CHANGELOG.md','QA.md'];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.posix.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.isFile())files.push(file);}}
roots.forEach(walk);
const output=files.map(file=>({path:file,encoding:file.endsWith('.png')?'base64':'utf-8',content:fs.readFileSync(file,file.endsWith('.png')?'base64':'utf8')}));
if(output.some(f=>/sk-[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9_-]{20,}/.test(f.content)))throw new Error('Potential secret in publish files');
const serialized=JSON.stringify(output);
const offset=Number(process.argv[2]||0);
if(process.argv[2]==='length')process.stdout.write(String(serialized.length));
else process.stdout.write(JSON.stringify(serialized.slice(offset,offset+16000)));
