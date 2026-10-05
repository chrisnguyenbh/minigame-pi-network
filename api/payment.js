import { method, identifier, json, handleError } from '../server/common.js';
import { verifyPiUser, piRequest, ownsPayment, paymentView } from '../server/pi.js';
import { paymentCredits } from '../server/mg.js';
export default async function handler(req, res) {
  if (!method(req, res, 'GET')) return;
  try {
    const user = await verifyPiUser(req), paymentId = identifier(req.query?.paymentId, 'payment_id');
    const payment = await piRequest(paymentId); ownsPayment(payment, user, paymentId);
    return json(res, 200, { ok:true, paymentId, response:paymentView(payment, paymentCredits(payment)) });
  } catch (error) { return handleError(res, error); }
}
