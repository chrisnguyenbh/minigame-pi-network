import PiBackendModule from "pi-backend";

// pi-backend@0.1.3 is CommonJS. On newer Node/Vercel runtimes its
// default import can be wrapped as { default: PiNetwork }. Resolve both shapes.
const PiNetwork =
  typeof PiBackendModule === "function"
    ? PiBackendModule
    : PiBackendModule?.default;

if (typeof PiNetwork !== "function") {
  throw new TypeError("Unable to load PiNetwork constructor from pi-backend");
}

const PI_ME_URL = "https://api.minepi.com/v2/me";
const REWARD_KIND = "minigame_a2u_test_reward";

function json(res, status, body) {
  res.status(status).setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

async function verifyPiUser(accessToken) {
  const response = await fetch(PI_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = new Error("Pi access token is invalid or expired.");
    error.status = 401;
    throw error;
  }

  const data = await response.json();
  const user = data?.user ?? data;
  if (!user?.uid) {
    const error = new Error("Pi did not return a verified uid.");
    error.status = 401;
    throw error;
  }
  return user;
}

function rewardAmount() {
  const parsed = Number(process.env.A2U_TEST_AMOUNT || "0.01");
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 0.1) return 0.01;
  return parsed;
}

async function recoverIncomplete(pi) {
  const pending = await pi.getIncompleteServerPayments();
  const payment = pending?.[0];
  if (!payment) return null;

  if (payment?.metadata?.kind !== REWARD_KIND) {
    const error = new Error("Another incomplete app payment exists. Resolve it before sending a test reward.");
    error.status = 409;
    throw error;
  }

  const paymentId = payment.identifier;
  let txid = payment.transaction?.txid || null;
  if (!txid) txid = await pi.submitPayment(paymentId);
  const completed = await pi.completePayment(paymentId, txid);
  return { paymentId, txid, completed, recovered: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return json(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const apiKey = process.env.PI_API_KEY;
  const privateSeed = process.env.PI_WALLET_PRIVATE_SEED;

  if (!apiKey || !privateSeed) {
    return json(res, 503, {
      ok: false,
      error: "server_not_configured",
      message: "PI_API_KEY or PI_WALLET_PRIVATE_SEED is missing in Vercel Environment Variables.",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body ||= {};

  const accessToken = String(body.accessToken || "").trim();
  if (!accessToken) {
    return json(res, 400, { ok: false, error: "missing_access_token" });
  }

  try {
    const user = await verifyPiUser(accessToken);
    const pi = new PiNetwork(apiKey, privateSeed);

    const recovered = await recoverIncomplete(pi);
    if (recovered) {
      return json(res, 200, {
        ok: true,
        recovered: true,
        username: user.username || null,
        paymentId: recovered.paymentId,
        txid: recovered.txid,
        network: recovered.completed?.network || null,
        status: recovered.completed?.status || null,
      });
    }

    const amount = rewardAmount();
    const paymentId = await pi.createPayment({
      amount,
      memo: "MiniGame Testnet A2U reward",
      metadata: {
        kind: REWARD_KIND,
        purpose: "Pi Developer Checklist - 5 unique wallets",
        createdAt: new Date().toISOString(),
      },
      uid: user.uid,
    });

    const txid = await pi.submitPayment(paymentId);
    const completed = await pi.completePayment(paymentId, txid);

    return json(res, 200, {
      ok: true,
      username: user.username || null,
      amount,
      paymentId,
      txid,
      network: completed?.network || null,
      status: completed?.status || null,
    });
  } catch (err) {
    console.error("A2U reward failed", err);
    const status = Number(err?.status) || 500;
    return json(res, status, {
      ok: false,
      error: err?.name || "a2u_reward_failed",
      message: err?.message || "App-to-User reward failed.",
    });
  }
}
