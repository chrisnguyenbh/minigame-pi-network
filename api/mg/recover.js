import { method, json, handleError } from '../../server/common.js';
import { verifyPiUser } from '../../server/pi.js';
import { recoverPayments } from '../../server/mg.js';
export default async function handler(req, res) {
  if (!method(req, res, 'POST')) return;
  try { const user = await verifyPiUser(req); return json(res, 200, { ok:true, ...await recoverPayments(user) }); }
  catch (error) { return handleError(res, error); }
}
