import { method, json, handleError } from '../server/common.js';
import { network } from '../server/pi.js';
export default function handler(req, res) {
  if (!method(req, res, 'GET')) return;
  try { const current=network(); return json(res,200,{ok:true,network:current,sandbox:current==='Pi Testnet'}); }
  catch(error){return handleError(res,error);}
}
