export function failure(message, status = 400) {
  return Object.assign(new Error(message), { status });
}
export function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}
export function method(req, res, allowed) {
  if (req.method === allowed) return true;
  res.setHeader('Allow', allowed);
  json(res, 405, { ok:false, error:'method_not_allowed' });
  return false;
}
export function bodyOf(req) {
  let body = req.body;
  if (typeof body === 'string') {
    if (body.length > 16384) throw failure('body_too_large', 413);
    try { body = JSON.parse(body); } catch { throw failure('invalid_json'); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw failure('invalid_body');
  return body;
}
export function identifier(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(value)) throw failure(`invalid_${label}`);
  return value;
}
export function handleError(res, error) {
  return json(res, error.status || 502, { ok:false, error:error.status ? error.message : 'service_unavailable' });
}
export async function fetchJson(url, options = {}) {
  let response;
  try { response = await fetch(url, { ...options, signal:AbortSignal.timeout(12000) }); }
  catch { throw failure('upstream_unavailable', 502); }
  const data = await response.json().catch(() => null);
  return { response, data };
}
