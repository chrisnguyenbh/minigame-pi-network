import {json,method,handleError} from '../server/common.js';
import {network} from '../server/pi.js';
export default function handler(req,res){
  if(!method(req,res,'GET'))return;
  try{return json(res,200,{ok:true,version:'9.7.0',network:network(),paymentFlow:'U2A',sandbox:network()==='Pi Testnet',configured:Boolean(String(process.env.PI_API_KEY||'').trim()),a2uConfigured:false});}
  catch(error){return handleError(res,error);}
}
