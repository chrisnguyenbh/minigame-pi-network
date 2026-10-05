import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.bmp':'image/bmp','.mp3':'audio/mpeg','.wav':'audio/wav'};
http.createServer(async(req,res)=>{
  try{
    const rawRoute=decodeURIComponent(req.url.split('?')[0]);
    if(rawRoute.split('/').some(x=>x.startsWith('.'))){res.writeHead(404);res.end();return;}
    const url=new URL(req.url,'http://localhost');
    if(url.pathname.startsWith('/api/')){
      if(!/^\/api\/[a-z0-9/-]+$/.test(url.pathname))throw new Error('not_found');
      const target=path.join(root,url.pathname+'.js');
      const {default:handler}=await import(pathToFileURL(target));
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>16384){res.writeHead(413);res.end();return;}chunks.push(chunk);}
      req.body=Buffer.concat(chunks).toString()||{};req.query=Object.fromEntries(url.searchParams);
      res.status=n=>{res.statusCode=n;return res;};await handler(req,res);return;
    }
    const route=decodeURIComponent(url.pathname);
    const target=path.resolve(root,'.'+route+(route.endsWith('/')?'index.html':''));
    if(!target.startsWith(root)||route.split('/').some(x=>x.startsWith('.'))||/^\/(server|tests|scripts|api)(\/|$)/.test(route)){res.writeHead(404);res.end();return;}
    const bytes=await fs.readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream'});res.end(bytes);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||8080,'127.0.0.1',()=>console.log(`MiniGame: http://127.0.0.1:${process.env.PORT||8080}`));
