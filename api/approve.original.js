const API_BASE = "https://api.minepi.com/v2";
function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { ok:false, error:"method_not_allowed" });
  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) return json(res, 503, { ok:false, error:"server_not_configured", message:"PI_API_KEY is missing in Vercel Environment Variables." });
  let body = req.body || {};
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const paymentId = String(body.paymentId || "").trim();
  if (!paymentId) return json(res, 400, { ok:false, error:"missing_payment_id" });
  try {
    const r = await fetch(`${API_BASE}/payments/${encodeURIComponent(paymentId)}/approve`, {
      method:"POST", headers:{ Authorization:`Key ${apiKey}`, "Content-Type":"application/json" }
    });
    const text = await r.text(); let data={}; try{data=JSON.parse(text)}catch{}
    if (!r.ok) return json(res, r.status, {ok:false,error:"pi_approval_failed",message:data?.error||data?.message||text||"Pi approval failed", pi:data});
    return json(res, 200, {ok:true,payment:data});
  } catch(e) { console.error(e); return json(res,500,{ok:false,error:"server_error",message:e.message}); }
}
