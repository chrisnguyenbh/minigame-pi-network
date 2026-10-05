import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=path.resolve(new URL('../',import.meta.url).pathname);let scripts=0,refs=0,failed=0;
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function check(code,type,label){scripts++;const result=spawnSync(process.execPath,['--input-type='+type,'--check'],{input:code,encoding:'utf8'});if(result.status){failed++;console.error(label,result.stderr);}}
for(const file of walk(root)){
 const ext=path.extname(file);if(!['.js','.html','.css'].includes(ext))continue;const text=fs.readFileSync(file,'utf8');
 if(ext==='.js'){scripts++;const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(result.status){failed++;console.error(file,result.stderr);}}
 if(ext==='.html')for(const block of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(!/\bsrc\s*=/.test(block[1])&&!/application\/json/.test(block[1]))check(block[2],/type\s*=\s*["']module/.test(block[1])?'module':'commonjs',file);
 }
 const matches=ext==='.html'?[...text.matchAll(/<(?:script|img|link|iframe)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]:ext==='.css'?[...text.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)]:[];
 for(const match of matches){const ref=match[1];if(/^(https?:|data:|\/\/|#)/.test(ref)||ref.includes('${'))continue;refs++;if(!fs.existsSync(path.resolve(path.dirname(file),ref.split(/[?#]/)[0]))){failed++;console.error('Missing resource',path.relative(root,file),ref);}}
}
console.log(JSON.stringify({scripts,localReferences:refs,failures:failed}));process.exitCode=failed?1:0;
