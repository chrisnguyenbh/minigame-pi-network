import { createHash } from 'node:crypto';
import { method, bodyOf, identifier, json, handleError, failure } from '../../server/common.js';
import { verifyPiUser } from '../../server/pi.js';
import { redis, balanceKey, spendKey, validBalance } from '../../server/redis.js';
import { spendProduct } from '../../server/mg.js';
export default async function handler(req, res) {
  if (!method(req, res, 'POST')) return;
  try {
    const user = await verifyPiUser(req), body = bodyOf(req);
    const requestId = identifier(body.requestId, 'request_id'), purpose = identifier(body.purpose, 'purpose');
    const amount = spendProduct(purpose, body.amount);
    const fingerprint = createHash('sha256').update(JSON.stringify({ purpose, amount })).digest('hex');
    const script = `-- MG_SPEND_V2
      local old = redis.call('GET', KEYS[2])
      if old then
        local receipt = cjson.decode(old)
        if receipt.fingerprint ~= ARGV[2] then return {-2, receipt.balance} end
        return {0, receipt.balance}
      end
      local bal = tonumber(redis.call('GET', KEYS[1]) or '0')
      local amount = tonumber(ARGV[1])
      if not bal or bal < 0 or bal > 9007199254740991 or bal % 1 ~= 0 then return redis.error_reply('invalid_balance') end
      if bal < amount then return {-1, bal} end
      local result = redis.call('DECRBY', KEYS[1], amount)
      redis.call('SET', KEYS[2], cjson.encode({fingerprint=ARGV[2],balance=result,amount=amount,purpose=ARGV[3]}))
      return {1, result}`;
    const result = await redis(['EVAL', script, '2', balanceKey(user.uid), spendKey(user.uid,requestId), String(amount), fingerprint, purpose]);
    if (!Array.isArray(result) || result.length !== 2) throw failure('invalid_spend_result', 502);
    const code = Number(result[0]), balance = validBalance(result[1]);
    if (code === -1) return json(res, 409, { ok:false, error:'insufficient_mg', balance });
    if (code === -2) throw failure('request_id_conflict', 409);
    if (![0,1].includes(code)) throw failure('invalid_spend_result', 502);
    return json(res, 200, { ok:true, spent:amount, balance, purpose, requestId, duplicate:code===0 });
  } catch (error) { return handleError(res, error); }
}
