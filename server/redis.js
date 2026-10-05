import { failure, fetchJson } from './common.js';
import { network } from './pi.js';
export async function redis(command) {
  const url = String(process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || '').replace(/\/+$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN;
  if (!url || !token) throw failure('missing_mg_database', 503);
  const { response, data } = await fetchJson(url, { method:'POST', headers:{ Authorization:`Bearer ${token}`, 'Content-Type':'application/json' }, body:JSON.stringify(command) });
  if (!response.ok || !data || data.error || !Object.hasOwn(data, 'result')) throw failure('mg_database_unavailable', 502);
  return data.result;
}
const prefix=()=>network()==='Pi Testnet'?'mg:testnet':'mg';
export const balanceKey=uid=>`${prefix()}:balance:${uid}`;
export const pendingKey=uid=>`${prefix()}:pending:${uid}`;
export const creditedKey=id=>`${prefix()}:credited_payment:${id}`;
export const spendKey=(uid,id)=>`${prefix()}:spent:${uid}:${id}`;
export function validBalance(raw) {
  const n = Number(raw ?? 0);
  if (!Number.isSafeInteger(n) || n < 0) throw failure('invalid_mg_balance', 502);
  return n;
}
