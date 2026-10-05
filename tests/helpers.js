import fs from 'node:fs';import vm from 'node:vm';
export const source=rel=>fs.readFileSync(new URL('../'+rel,import.meta.url),'utf8');
export function storage(initial={}){
  const map=new Map(Object.entries(initial));
  return {get length(){return map.size;},key:i=>[...map.keys()][i]??null,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),map};
}
export function element(){
 const classes=new Set();return {style:{},children:[],dataset:{},value:'',disabled:false,isConnected:true,innerHTML:'',textContent:'',classList:{add:(...a)=>a.forEach(x=>classes.add(x)),remove:(...a)=>a.forEach(x=>classes.delete(x)),contains:x=>classes.has(x),toggle:(x,v)=>{if(v===undefined)v=!classes.has(x);v?classes.add(x):classes.delete(x);}},appendChild(e){this.children.push(e);},prepend(e){this.children.unshift(e);},querySelector(){return element();},querySelectorAll(){return [];},addEventListener(){},focus(){},setPointerCapture(){},getBoundingClientRect(){return {left:0,top:0,width:600,height:700};}};
}
export function domFor(html){
 const map=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>[m[1],element()]));
 return {map,document:{body:element(),hidden:false,getElementById:id=>map.get(id)||null,createElement:element,querySelector:selector=>selector.startsWith('#')?map.get(selector.slice(1)):element(),querySelectorAll:()=>[],addEventListener(){}}};
}
export function caro(){
 const html=source('games/caro.html'),{document}=domFor(html);
 const context=vm.createContext({console,document,window:{innerWidth:1000,addEventListener(){}},setTimeout:()=>1,clearTimeout(){}});
 const code=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('let N=19'));
 vm.runInContext(code,context);return context;
}
export async function invoke(handler,request){
 let status=200,body;const res={headers:{},status(n){status=n;return this;},setHeader(k,v){this.headers[k]=v;return this;},end(s){body=JSON.parse(s);}};
 await handler(request,res);return {status,body,headers:res.headers};
}
export function backend(){
 const balances=new Map(),credited=new Set(),pending=new Map(),receipts=new Map(),calls=[];
 let payment={identifier:'payment_A',user_uid:'user_A',amount:0.01,direction:'user_to_app',network:'Pi Network',metadata:{kind:'mg_credit_topup',credits:1},status:{developer_approved:false,developer_completed:false,transaction_verified:true,cancelled:false,user_cancelled:false},transaction:{txid:'tx_A',verified:true}};
 const api={user:'user_A',badToken:false,completeError:false,creditError:false,dbError:false,verificationFails:false,payment,balances,credited,pending,receipts,calls};
 api.fetch=async(url,opts={})=>{
   calls.push({url,opts});let status=200,result;
   if(url.endsWith('/me')){status=api.badToken?401:200;result=api.badToken?{}:{uid:api.user,username:'tester'};}
   else if(url==='https://redis.test'){
     if(api.dbError)throw new Error('offline');
     const args=JSON.parse(opts.body),[cmd,...rest]=args;
     if(cmd==='PING')result='PONG';
     if(cmd==='GET')result=balances.get(rest[0])??null;
     if(cmd==='HSET'){pending.set(rest[1],{key:rest[0],value:rest[2]});result=1;}
     if(cmd==='HDEL'){result=pending.delete(rest[1])?1:0;}
     if(cmd==='HGETALL')result=[...pending.entries()].filter(([,v])=>v.key===rest[0]).flatMap(([k,v])=>[k,v.value]);
     if(cmd==='EVAL'){
       const [script,count,key1,key2,...argv]=rest;
       if(script.includes('MG_CREDIT_V2')){
         if(api.creditError){api.creditError=false;throw new Error('redis outage after completion');}
         if(credited.has(key2))result=[0,balances.get(key1)||0];
         else{const n=(balances.get(key1)||0)+Number(argv[0]);balances.set(key1,n);credited.add(key2);result=[1,n];}
       }else if(script.includes('MG_SPEND_V2')){
         const old=receipts.get(key2),bal=balances.get(key1)||0,amount=Number(argv[0]);
         if(old)result=[old.fingerprint===argv[1]?0:-2,old.balance];
         else if(bal<amount)result=[-1,bal];
         else{balances.set(key1,bal-amount);receipts.set(key2,{fingerprint:argv[1],balance:bal-amount});result=[1,bal-amount];}
       }else throw new Error('unknown Lua script');
     }
     result={result};
   }else{
     if(url.endsWith('/approve')){api.payment.status.developer_approved=true;}
     if(url.endsWith('/complete')){
       api.payment.status.developer_completed=true;
       if(api.verificationFails){api.payment.status.transaction_verified=false;api.payment.transaction.verified=false;}
       if(api.completeError){api.completeError=false;throw new Error('response lost after Pi completed');}
     }
     if(url.endsWith('/cancel'))api.payment.status.cancelled=true;
     result=structuredClone(api.payment);
   }
   return new Response(JSON.stringify(result),{status});
 };
 return api;
}
