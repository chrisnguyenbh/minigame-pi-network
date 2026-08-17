const PI_API_BASE = "https://api.minepi.com/v2";
function json(res,status,body){res.status(status).setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");return res.end(JSON.stringify(body));}
export default async function handler(req,res){
  if(req.method!=="GET")return json(res,405,{ok:false,error:"method_not_allowed"});
  const paymentId=String(req.query?.paymentId||"").trim(); if(!paymentId)return json(res,400,{ok:false,error:"missing_payment_id"});
  const rawKey=String(process.env.PI_API_KEY||"").trim(); if(!rawKey)return json(res,503,{ok:false,error:"missing_pi_api_key"});
  const apiKey=rawKey.replace(/^Key\s+/i,"");
  try{const upstream=await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}`,{headers:{Authorization:`Key ${apiKey}`}});const text=await upstream.text();let response=null;try{response=text?JSON.parse(text):null}catch{response=text}return json(res,upstream.ok?200:upstream.status,{ok:upstream.ok,paymentId,upstreamStatus:upstream.status,response,network:"Pi Mainnet"});}
  catch(err){return json(res,502,{ok:false,error:"pi_payment_request_failed",paymentId,message:err?.message||"Pi payment request failed"});}
}
