function json(res,status,body){res.status(status).setHeader("Content-Type","application/json; charset=utf-8");res.setHeader("Cache-Control","no-store");return res.end(JSON.stringify(body));}
export default function handler(req,res){ return json(res,410,{ok:false,error:"a2u_reward_disabled",message:"App-to-user reward endpoint is disabled in production."}); }
