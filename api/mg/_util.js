const PI_API_BASE = "https://api.minepi.com/v2";

export function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

export async function verifyPiUser(req) {
  const auth = String(req.headers?.authorization || "");
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) throw Object.assign(new Error("missing_access_token"), { status: 401 });

  const response = await fetch(`${PI_API_BASE}/me`, {
    headers: { Authorization: `Bearer ${match[1]}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.uid) {
    throw Object.assign(new Error("invalid_access_token"), { status: 401, data });
  }
  return data;
}

function redisConfig() {
  const url = String(process.env.UPSTASH_REDIS_REST_URL || "").replace(/\/+$/, "");
  const token = String(process.env.UPSTASH_REDIS_REST_TOKEN || "");
  if (!url || !token) {
    throw Object.assign(new Error("missing_mg_database"), { status: 503 });
  }
  return { url, token };
}

export async function redis(command) {
  const { url, token } = redisConfig();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.error) {
    throw Object.assign(new Error(data?.error || "redis_error"), { status: 502, data });
  }
  return data?.result;
}

export function balanceKey(uid) {
  return `mg:balance:${uid}`;
}

export function paymentKey(paymentId) {
  return `mg:credited_payment:${paymentId}`;
}
