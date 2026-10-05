import { method, json, handleError } from '../../server/common.js';
import { verifyPiUser } from '../../server/pi.js';
import { redis, balanceKey, validBalance } from '../../server/redis.js';
export default async function handler(req, res) {
  if (!method(req, res, 'GET')) return;
  try {
    const user = await verifyPiUser(req), balance = validBalance(await redis(['GET', balanceKey(user.uid)]));
    return json(res, 200, { ok:true, uid:user.uid, username:user.username || null, balance, unit:'MG', rate:{pi:0.01,mg:1} });
  } catch (error) { return handleError(res, error); }
}
