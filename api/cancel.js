import { method, bodyOf, identifier, json, handleError, failure } from '../server/common.js';
import { verifyPiUser, piRequest, ownsPayment, cancelled } from '../server/pi.js';
export default async function handler(req, res) {
  if (!method(req, res, 'POST')) return;
  try {
    const user = await verifyPiUser(req), paymentId = identifier(bodyOf(req).paymentId, 'payment_id');
    let payment = await piRequest(paymentId); ownsPayment(payment, user, paymentId);
    if (payment.status?.developer_completed || payment.transaction) throw failure('payment_has_transaction', 409);
    if (!cancelled(payment)) payment = await piRequest(paymentId, 'cancel');
    ownsPayment(payment, user, paymentId);
    if (!cancelled(payment)) throw failure('payment_not_cancelled', 409);
    return json(res, 200, { ok:true, paymentId });
  } catch (error) { return handleError(res, error); }
}
