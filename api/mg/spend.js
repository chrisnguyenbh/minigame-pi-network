import { json, verifyPiUser, redis, balanceKey } from "./_util.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    const user = await verifyPiUser(req);
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    body ||= {};

    const amount = Number(body.amount);
    const purpose = String(body.purpose || "").trim().slice(0, 80);

    if (!Number.isInteger(amount) || amount <= 0) {
      return json(res, 400, { ok: false, error: "invalid_mg_amount" });
    }
    if (!purpose) {
      return json(res, 400, { ok: false, error: "missing_purpose" });
    }

    const script = `
      local bal = tonumber(redis.call('GET', KEYS[1]) or '0')
      local amount = tonumber(ARGV[1])
      if bal < amount then return -1 end
      return redis.call('DECRBY', KEYS[1], amount)
    `;
    const result = await redis(["EVAL", script, "1", balanceKey(user.uid), String(amount)]);

    if (Number(result) < 0) {
      const raw = await redis(["GET", balanceKey(user.uid)]);
      return json(res, 409, {
        ok: false,
        error: "insufficient_mg",
        balance: Number.parseInt(raw || "0", 10) || 0
      });
    }

    return json(res, 200, {
      ok: true,
      spent: amount,
      balance: Number(result),
      purpose
    });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || "mg_spend_failed"
    });
  }
}
