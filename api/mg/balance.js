import { json, verifyPiUser, redis, balanceKey } from "./_util.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    const user = await verifyPiUser(req);
    const raw = await redis(["GET", balanceKey(user.uid)]);
    const balance = Number.parseInt(raw || "0", 10) || 0;

    return json(res, 200, {
      ok: true,
      uid: user.uid,
      username: user.username || null,
      balance,
      unit: "MG",
      rate: { pi: 0.01, mg: 1 }
    });
  } catch (error) {
    return json(res, error.status || 500, {
      ok: false,
      error: error.message || "mg_balance_failed"
    });
  }
}
