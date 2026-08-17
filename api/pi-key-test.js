const PI_API_BASE="https://api.minepi.com/v2";
function json(res,status,body){res.status(status).setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");return res.end(JSON.stringify(body));}
export default async function handler(req,res){
  if(req.method!=="GET")return json(res,405,{ok:false,error:"method_not_allowed"});
  const rawKey=String(process.env.PI_API_KEY||"").trim();
  if(!rawKey)return json(res,503,{ok:false,network:"Pi Mainnet",configured:false,error:"missing_pi_api_key"});
  const apiKey=rawKey.replace(/^Key\s+/i,"");
  try{
    const upstream=await fetch(`${PI_API_BASE}/payments/debug-invalid-payment-id`,{headers:{Authorization:`Key ${apiKey}`}});
    const text=await upstream.text(); let response=null; try{response=text?JSON.parse(text):null}catch{response=text}
    return json(res,200,{ok:true,network:"Pi Mainnet",configured:true,upstreamStatus:upstream.status,apiKeyAccepted:upstream.status!==401&&upstream.status!==403,response});
  }catch(err){return json(res,502,{ok:false,network:"Pi Mainnet",configured:true,error:"pi_api_unreachable",message:err?.message||"Pi API unreachable"});}
}
