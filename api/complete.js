import { method, bodyOf, identifier, json, handleError } from '../server/common.js';
import { verifyPiUser } from '../server/pi.js';
import { completePayment } from '../server/mg.js';
export default async function handler(req, res) {
  if (!method(req, res, 'POST')) return;
  try {
    const user = await verifyPiUser(req), body = bodyOf(req);
    const result = await completePayment(user, identifier(body.paymentId, 'payment_id'), identifier(body.txid, 'txid'));
    return json(res, 200, { ok:true, ...result });
  } catch (error) { return handleError(res, error); }
}
