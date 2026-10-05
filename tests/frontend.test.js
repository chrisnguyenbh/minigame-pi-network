import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {source,storage,element} from './helpers.js';
const flush=()=>new Promise(r=>setImmediate(r));
async function setup({incomplete=false,failComplete=false}={}){
 const calls=[],mem=storage(),status=element();let callbacks,finished=false;
 const auth={accessToken:'token',user:{uid:'user_A',username:'tester'}};
 const Pi={init(){},authenticate:async(scopes,onIncomplete)=>{if(incomplete)onIncomplete({identifier:'old_payment',transaction:{txid:'old_tx'}});return auth;},createPayment(data,cb){callbacks=cb;}};
 const fetch=async(url,opts={})=>{
   calls.push({url,opts});let result={ok:true};
   if(url==='/api/config')result={ok:true,sandbox:false};
   if(url==='/api/mg/recover')result={ok:true,results:[],pending:0};
   if(url==='/api/complete'){
     if(failComplete){failComplete=false;return new Response(JSON.stringify({ok:false,error:'mg_database_unavailable'}),{status:502});}
     const body=JSON.parse(opts.body);result={ok:true,paymentId:body.paymentId,txid:body.txid,mg:{credited:1,balance:1,duplicate:false}};
   }
   return new Response(JSON.stringify(result),{status:200});
 };
 const sandbox={Pi,localStorage:mem,fetch,setTimeout,clearTimeout,AbortController,console};sandbox.window=sandbox;
 const c=vm.createContext(sandbox);vm.runInContext(source('assets/pi.js'),c);await c.MiniPi.init(status);await c.MiniPi.login(status,element());
 return {c,calls,mem,status,get callbacks(){return callbacks;},get finished(){return finished;},track(promise){promise.then(()=>finished=true,()=>finished=true);return promise;}};
}
test('payment promise waits for verified server completion, does not resolve on SDK return',async()=>{const s=await setup();const p=s.track(s.c.MiniPi.createPayment({amount:.01,memo:'test',metadata:{},statusEl:s.status}));await flush();assert.equal(s.finished,false);await s.callbacks.onReadyForServerApproval('payment_A');await flush();assert.equal(s.finished,false);await s.callbacks.onReadyForServerCompletion('payment_A','tx_A');const result=await p;assert.equal(result.mg.credited,1);assert.equal(s.finished,true);const calls=s.calls.filter(c=>['/api/approve','/api/complete'].includes(c.url));assert.ok(calls.every(c=>c.opts.headers.Authorization==='Bearer token'));});
test('cancel rejects instead of claiming purchase success',async()=>{const s=await setup(),p=s.c.MiniPi.createPayment({amount:.01,memo:'test',metadata:{},statusEl:s.status});const assertion=assert.rejects(p,/hủy/);s.callbacks.onCancel('payment_A');await assertion;});
test('SDK error rejects and another payment can start',async()=>{const s=await setup(),p=s.c.MiniPi.createPayment({amount:.01,memo:'test',metadata:{},statusEl:s.status});const assertion=assert.rejects(p,/sdk failed/);s.callbacks.onError(new Error('sdk failed'));await assertion;const second=s.c.MiniPi.createPayment({amount:.01,memo:'test',metadata:{},statusEl:s.status});const cancelled=assert.rejects(second);s.callbacks.onCancel('b');await cancelled;});
test('concurrent payment blocked until the first is finalized',async()=>{const s=await setup(),p=s.c.MiniPi.createPayment({amount:.01,memo:'test',metadata:{},statusEl:s.status});await assert.rejects(s.c.MiniPi.createPayment({amount:.01}),/đang xử lý/);const cancelled=assert.rejects(p);s.callbacks.onCancel('a');await cancelled;});
test('temporary completion failure stays pending and recover settles the same promise',async()=>{const s=await setup({failComplete:true}),p=s.track(s.c.MiniPi.createPayment({amount:.01,memo:'test',metadata:{},statusEl:s.status}));await s.callbacks.onReadyForServerCompletion('payment_A','tx_A');await flush();assert.equal(s.finished,false);assert.ok(s.mem.getItem('minigame_mg_pending_v2').includes('payment_A'));await s.c.MiniPi.recoverPending();const result=await p;assert.equal(result.mg.balance,1);assert.equal(s.mem.getItem('minigame_mg_pending_v2'),'[]');});
test('incomplete callback before authenticate resolves uses the returned token',async()=>{const s=await setup({incomplete:true});const completion=s.calls.find(c=>c.url==='/api/complete');assert.ok(completion);assert.equal(completion.opts.headers.Authorization,'Bearer token');assert.equal(JSON.parse(completion.opts.body).paymentId,'old_payment');});
test('storage failure does not break Pi login or cached username',async()=>{const s=await setup();s.c.localStorage={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};assert.equal(s.c.MiniPi.cachedUsername(),'');assert.ok(await s.c.MiniPi.login(element(),element()));});
test('MG spending requires stable request id and sends it to backend',async()=>{const calls=[],c=vm.createContext({window:{},AbortController,setTimeout,clearTimeout,fetch:async(url,opts)=>{calls.push({url,opts});return new Response(JSON.stringify({ok:true}),{status:200});}});vm.runInContext(source('assets/mg.js'),c);await assert.rejects(c.window.MG.spend('token',1,'x'));await c.window.MG.spend('token',1,'x',{},'id_A');assert.equal(JSON.parse(calls[0].opts.body).requestId,'id_A');});
