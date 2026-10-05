import { method, bodyOf, identifier, json, handleError, failure } from '../server/common.js';
import { verifyPiUser, piRequest, ownsPayment, cancelled, paymentView } from '../server/pi.js';
import { paymentCredits } from '../server/mg.js';
import { redis } from '../server/redis.js';
export default async function handler(req, res) {
  if (!method(req, res, 'POST')) return;
  try {
    const user = await verifyPiUser(req);
    const paymentId = identifier(bodyOf(req).paymentId, 'payment_id');
    let payment = await piRequest(paymentId);
    ownsPayment(payment, user, paymentId);
    const credits = paymentCredits(payment);
    if (cancelled(payment) || payment.status?.developer_completed) throw failure('payment_not_approvable', 409);
    await redis(['PING']);
    if (!payment.status?.developer_approved) payment = await piRequest(paymentId, 'approve');
    ownsPayment(payment, user, paymentId); paymentCredits(payment);
    if (payment.status?.developer_approved !== true) throw failure('payment_not_approved', 409);
    return json(res, 200, { ok:true, paymentId, response:paymentView(payment, credits) });
  } catch (error) { return handleError(res, error); }
}
