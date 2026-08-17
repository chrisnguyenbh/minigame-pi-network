const PI_API_BASE = "https://api.minepi.com/v2";
function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, {ok:false,error:"method_not_allowed"}); }
  let body=req.body; if(typeof body==="string"){try{body=JSON.parse(body)}catch{body={}}} body ||= {};
  const paymentId=String(body.paymentId||"").trim(); const txid=String(body.txid||"").trim();
  const debugId=`complete_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  if(!paymentId||!txid) return json(res,400,{ok:false,error:"missing_payment_id_or_txid",debugId,paymentId,txid:!!txid});
  const rawKey=String(process.env.PI_API_KEY||"").trim(); if(!rawKey) return json(res,503,{ok:false,error:"missing_pi_api_key",debugId,paymentId});
  const apiKey=rawKey.replace(/^Key\s+/i,""); const started=Date.now();
  try{
    console.log(JSON.stringify({event:"pi_complete_start",debugId,paymentId,txid}));
    const upstream=await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`,{method:"POST",headers:{Authorization:`Key ${apiKey}`,"Content-Type":"application/json"},body:JSON.stringify({txid})});
    const text=await upstream.text(); let response=null; try{response=text?JSON.parse(text):null}catch{response=text}
    const durationMs=Date.now()-started;
    console.log(JSON.stringify({event:"pi_complete_result",debugId,paymentId,txid,upstreamStatus:upstream.status,durationMs,response}));
    return json(res,upstream.ok?200:upstream.status,{ok:upstream.ok,debugId,paymentId,txid,upstreamStatus:upstream.status,upstreamStatusText:upstream.statusText,durationMs,response,network:"Pi Mainnet"});
  }catch(err){return json(res,502,{ok:false,error:"pi_complete_request_failed",debugId,paymentId,txid,durationMs:Date.now()-started,message:err?.message||"Pi completion request failed"});}
}
