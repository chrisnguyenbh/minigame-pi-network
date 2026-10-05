// Retained only to explicitly close the former public diagnostic route.
export default function handler(req, res) {
  res.status(410).setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.end(JSON.stringify({ok:false,error:'diagnostic_disabled'}));
}
