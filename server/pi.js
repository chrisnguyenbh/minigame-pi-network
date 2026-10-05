import { failure, fetchJson } from './common.js';
const BASE = 'https://api.minepi.com/v2';
export function network() {
  const value = process.env.PI_NETWORK || 'Pi Network';
  if (!['Pi Network','Pi Testnet'].includes(value)) throw failure('invalid_pi_network_config', 503);
  return value;
}
export async function verifyPiUser(req) {
  const match = String(req.headers?.authorization || '').match(/^Bearer\s+(\S+)$/i);
  if (!match) throw failure('missing_access_token', 401);
  const { response, data } = await fetchJson(`${BASE}/me`, { headers:{ Authorization:`Bearer ${match[1]}` } });
  if (!response.ok || !data?.uid) throw failure('invalid_access_token', 401);
  return data;
}
export async function piRequest(paymentId, action = '', payload) {
  const key = String(process.env.PI_API_KEY || '').trim().replace(/^Key\s+/i, '');
  if (!key) throw failure('missing_pi_api_key', 503);
  const { response, data } = await fetchJson(`${BASE}/payments/${encodeURIComponent(paymentId)}${action ? '/' + action : ''}`, {
    method:action ? 'POST' : 'GET',
    headers:{ Authorization:`Key ${key}`, 'Content-Type':'application/json' },
    ...(payload ? { body:JSON.stringify(payload) } : {})
  });
  if (!response.ok) throw failure('pi_request_failed', response.status >= 500 ? 502 : response.status);
  if (!data || typeof data !== 'object') throw failure('invalid_pi_response', 502);
  return data;
}
export function ownsPayment(payment, user, paymentId) {
  if (payment.identifier !== paymentId) throw failure('payment_identity_mismatch', 502);
  if (payment.user_uid !== user.uid) throw failure('payment_forbidden', 403);
  if (payment.direction !== 'user_to_app' || payment.network !== network()) throw failure('invalid_payment_direction_or_network');
}
export function cancelled(payment) { return payment.status?.cancelled === true || payment.status?.user_cancelled === true; }
export function completed(payment, txid) {
  return !cancelled(payment) && payment.status?.developer_completed === true &&
    payment.status?.transaction_verified === true && payment.transaction?.verified === true &&
    payment.transaction?.txid === txid;
}
export function paymentView(payment, credits) {
  return { identifier:payment.identifier, amount:payment.amount, credits, network:payment.network,
    status:payment.status, transaction:payment.transaction ? { txid:payment.transaction.txid, verified:payment.transaction.verified } : null };
}
