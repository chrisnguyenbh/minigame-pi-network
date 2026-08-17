const PI_API_BASE = "https://api.minepi.com/v2";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const started = Date.now();
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body ||= {};
  const paymentId = String(body.paymentId || "").trim();
  const debugId = `approve_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (!paymentId) {
    return json(res, 400, { ok: false, error: "missing_payment_id", debugId });
  }

  const rawKey = String(process.env.PI_API_KEY || "").trim();
  if (!rawKey) {
    return json(res, 503, { ok: false, error: "missing_pi_api_key", debugId, paymentId });
  }
  const apiKey = rawKey.replace(/^Key\s+/i, "");

  try {
    console.log(JSON.stringify({ event: "pi_approve_start", debugId, paymentId }));
    const upstream = await fetch(`${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/approve`, {
      method: "POST",
      headers: { Authorization: `Key ${apiKey}` },
    });
    const text = await upstream.text();
    let upstreamBody = null;
    try { upstreamBody = text ? JSON.parse(text) : null; } catch { upstreamBody = text; }
    const durationMs = Date.now() - started;

    console.log(JSON.stringify({ event: "pi_approve_result", debugId, paymentId, upstreamStatus: upstream.status, durationMs, response: upstreamBody }));

    return json(res, upstream.ok ? 200 : upstream.status, {
      ok: upstream.ok,
      debugId,
      paymentId,
      upstreamStatus: upstream.status,
      upstreamStatusText: upstream.statusText,
      durationMs,
      response: upstreamBody,
      network: "Pi Mainnet",
    });
  } catch (err) {
    const durationMs = Date.now() - started;
    console.error(JSON.stringify({ event: "pi_approve_exception", debugId, paymentId, durationMs, error: err?.message }));
    return json(res, 502, {
      ok: false,
      error: "pi_approve_request_failed",
      debugId,
      paymentId,
      durationMs,
      message: err?.message || "Pi approval request failed",
    });
  }
}
