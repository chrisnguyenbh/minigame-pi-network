const PI_API_BASE = "https://api.minepi.com/v2";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

function redisConfig() {
  const url = String(
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_URL ||
    ""
  ).replace(/\/+$/, "");

  const token = String(
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN ||
    ""
  );
  if (!url || !token) return null;
  return { url, token };
}

async function redis(command) {
  const cfg = redisConfig();
  if (!cfg) throw Object.assign(new Error("missing_mg_database"), { status: 503 });

  const response = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw Object.assign(new Error(data?.error || "redis_error"), { status: 502 });
  }
  return data?.result;
}

function mgCreditsForPayment(payment) {
  if (!payment || payment.direction !== "user_to_app") return 0;
  if (payment.network && payment.network !== "Pi Network") return 0;
  if (payment.metadata?.kind !== "mg_credit_topup") return 0;

  const amount = Number(payment.amount);
  const declared = Number(payment.metadata?.credits);

  const packages = new Map([
    ["0.01", 1],
    ["0.05", 5],
    ["0.10", 10],
    ["0.50", 50],
    ["1.00", 100]
  ]);

  const key = amount.toFixed(2);
  const expected = packages.get(key) || 0;
  if (!expected || declared !== expected) return 0;
  return expected;
}

async function creditMg(payment) {
  const credits = mgCreditsForPayment(payment);
  if (!credits) return { credited: 0, duplicate: false };
  if (!payment.user_uid || !payment.identifier) {
    throw Object.assign(new Error("invalid_payment_identity"), { status: 502 });
  }

  const balanceKey = `mg:balance:${payment.user_uid}`;
  const paymentKey = `mg:credited_payment:${payment.identifier}`;

  // Idempotent: a payment can credit MG only once.
  const script = `
    if redis.call('EXISTS', KEYS[2]) == 1 then
      return {0, tonumber(redis.call('GET', KEYS[1]) or '0')}
    end
    local newBalance = redis.call('INCRBY', KEYS[1], ARGV[1])
    redis.call('SET', KEYS[2], ARGV[1])
    return {1, newBalance}
  `;

  const result = await redis([
    "EVAL", script, "2",
    balanceKey, paymentKey,
    String(credits)
  ]);

  const creditedNow = Array.isArray(result) ? Number(result[0]) === 1 : false;
  const balance = Array.isArray(result) ? Number(result[1]) : null;

  return {
    credited: creditedNow ? credits : 0,
    duplicate: !creditedNow,
    balance
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body ||= {};

  const paymentId = String(body.paymentId || "").trim();
  const txid = String(body.txid || "").trim();
  const debugId = `complete_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (!paymentId || !txid) {
    return json(res, 400, {
      ok: false,
      error: "missing_payment_id_or_txid",
      debugId,
      paymentId,
      txid: !!txid
    });
  }

  const rawKey = String(process.env.PI_API_KEY || "").trim();
  if (!rawKey) {
    return json(res, 503, {
      ok: false,
      error: "missing_pi_api_key",
      debugId,
      paymentId
    });
  }

  const apiKey = rawKey.replace(/^Key\s+/i, "");
  const started = Date.now();

  try {
    const upstream = await fetch(
      `${PI_API_BASE}/payments/${encodeURIComponent(paymentId)}/complete`,
      {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ txid })
      }
    );

    const text = await upstream.text();
    let payment = null;
    try { payment = text ? JSON.parse(text) : null; } catch { payment = null; }

    if (!upstream.ok) {
      return json(res, upstream.status, {
        ok: false,
        error: "pi_complete_failed",
        debugId,
        paymentId,
        upstreamStatus: upstream.status,
        response: payment || text
      });
    }

    let mg = { credited: 0, duplicate: false, balance: null };

    // Only credit after Pi confirms a completed/verified U2A payment.
    if (
      payment?.status?.developer_completed === true &&
      payment?.status?.transaction_verified === true
    ) {
      const credits = mgCreditsForPayment(payment);
      if (credits > 0) {
        mg = await creditMg(payment);
      }
    }

    return json(res, 200, {
      ok: true,
      debugId,
      paymentId,
      txid,
      upstreamStatus: upstream.status,
      network: "Pi Mainnet",
      mg,
      durationMs: Date.now() - started
    });
  } catch (error) {
    return json(res, error.status || 502, {
      ok: false,
      error: error.message || "pi_completion_request_failed",
      debugId,
      paymentId,
      txid,
      durationMs: Date.now() - started
    });
  }
}
