import { failure } from './common.js';
import { ownsPayment, piRequest, cancelled, completed } from './pi.js';
import { redis, balanceKey, pendingKey, creditedKey, validBalance } from './redis.js';
export const PACKAGES = Object.freeze([{ amount:0.01, credits:1 },{ amount:0.05, credits:5 },{ amount:0.10, credits:10 },{ amount:0.50, credits:50 },{ amount:1, credits:100 }]);
export function paymentCredits(payment) {
  // Match a server-defined price exactly; never round an underpayment into a package.
  if (payment.metadata?.kind !== 'mg_credit_topup' || typeof payment.amount !== 'number' || !Number.isFinite(payment.amount)) throw failure('invalid_mg_package');
  const pack = PACKAGES.find(p => p.amount === payment.amount && p.credits === payment.metadata.credits);
  if (!pack) throw failure('invalid_mg_package');
  return pack.credits;
}
export async function creditMg(payment) {
  const credits = paymentCredits(payment);
  const script = `-- MG_CREDIT_V2
    if redis.call('EXISTS', KEYS[2]) == 1 then
      return {0, tonumber(redis.call('GET', KEYS[1]) or '0')}
    end
    local balance = tonumber(redis.call('GET', KEYS[1]) or '0')
    if not balance or balance < 0 or balance > 9007199254740991-tonumber(ARGV[1]) or balance % 1 ~= 0 then return redis.error_reply('invalid_balance') end
    local newBalance = redis.call('INCRBY', KEYS[1], ARGV[1])
    redis.call('SET', KEYS[2], ARGV[1])
    return {1, newBalance}`;
  const result = await redis(['EVAL', script, '2', balanceKey(payment.user_uid), creditedKey(payment.identifier), String(credits)]);
  if (!Array.isArray(result) || result.length !== 2 || ![0,1].includes(Number(result[0]))) throw failure('invalid_credit_result', 502);
  return { credited:Number(result[0]) === 1 ? credits : 0, duplicate:Number(result[0]) === 0, balance:validBalance(result[1]) };
}
export async function completePayment(user, paymentId, txid) {
  let payment = await piRequest(paymentId);
  ownsPayment(payment, user, paymentId);
  paymentCredits(payment);
  if (cancelled(payment)) throw failure('payment_cancelled', 409);
  if (payment.transaction?.txid !== txid) throw failure('payment_transaction_mismatch', 409);
  // Persist the recovery record before Pi's irreversible completion. It survives Redis/Pi timeouts.
  await redis(['HSET', pendingKey(user.uid), paymentId, JSON.stringify({ txid })]);
  if (!completed(payment, txid)) {
    try { payment = await piRequest(paymentId, 'complete', { txid }); }
    catch (error) {
      // A timeout/conflict may mean Pi already completed the transaction.
      const latest = await piRequest(paymentId);
      ownsPayment(latest, user, paymentId);
      if (!completed(latest, txid)) throw error;
      payment = latest;
    }
  }
  ownsPayment(payment, user, paymentId);
  paymentCredits(payment);
  if (!completed(payment, txid)) throw failure('payment_not_verified_or_completed', 409);
  const mg = await creditMg(payment);
  // If cleanup fails, later recovery is harmless because creditMg is idempotent.
  await redis(['HDEL', pendingKey(user.uid), paymentId]).catch(() => {});
  return { paymentId, txid, mg };
}
export async function recoverPayments(user) {
  const raw = await redis(['HGETALL', pendingKey(user.uid)]);
  const entries = Array.isArray(raw) ? Array.from({length:Math.floor(raw.length/2)},(_,i)=>[raw[i*2],raw[i*2+1]]) : Object.entries(raw || {});
  const results = [];
  for (const [id, value] of entries.slice(0,20)) {
    try {
      const { txid } = JSON.parse(value);
      if (typeof txid !== 'string') throw failure('invalid_pending_record');
      results.push({ ok:true, ...await completePayment(user, id, txid) });
    } catch (error) { results.push({ ok:false, paymentId:id, error:error.status ? error.message : 'recovery_pending' }); }
  }
  return { results, pending:entries.length - results.filter(r=>r.ok).length };
}
export function spendProduct(purpose, requestedAmount) {
  let catalog;
  try { catalog = JSON.parse(process.env.MG_SPEND_CATALOG || '{}'); } catch { throw failure('invalid_mg_catalog_config', 503); }
  if (!catalog || Array.isArray(catalog) || typeof catalog !== 'object') throw failure('invalid_mg_catalog_config', 503);
  if (!Object.hasOwn(catalog, purpose)) throw failure('unsupported_mg_purpose');
  const amount = catalog[purpose];
  if (!Number.isSafeInteger(amount) || amount <= 0 || requestedAmount !== amount) throw failure('invalid_mg_amount');
  return amount;
}
