// Sijal's small server on Cloudflare: serves the game and unlocks the Season Zero pass after a real PayPal payment.
// Secrets (set in Cloudflare → the "sijal" worker → Settings → Variables and Secrets, never in this file):
//   PAYPAL_CLIENT_ID, PAYPAL_SECRET  – from a PayPal REST app (developer.paypal.com)
//   PAYPAL_ENV                       – "sandbox" while testing, "live" for real money
//   FIREBASE_DB_SECRET               – Firebase → Project settings → Service accounts → Database secrets
const DB = 'https://sijal-fa367-default-rtdb.firebaseio.com';
const FB_KEY = 'AIzaSyABuacot7I8S6r-7bsTHbYgMWhQC7OHXi4';
const PRICE = 3; // the pass, in US dollars

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
const ppBase = env => env.PAYPAL_ENV === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

async function ppToken(env) {
  const r = await fetch(ppBase(env) + '/v1/oauth2/token', { method: 'POST', headers: { authorization: 'Basic ' + btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_SECRET), 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
  const j = await r.json(); if (!j.access_token) throw new Error('paypal auth'); return j.access_token;
}
// who is asking: Firebase checks the player's sign-in token and tells us the account id
async function whoIs(idToken) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FB_KEY, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken }) });
  const j = await r.json(); return j && j.users && j.users[0] ? j.users[0].localId : null;
}
const db = (env, path, init) => fetch(DB + path + '.json?auth=' + encodeURIComponent(env.FIREBASE_DB_SECRET), init).then(r => r.ok ? r.json() : Promise.reject(new Error('db ' + r.status)));

// the game asks: this order is paid, please unlock my pass
export async function claimPass(env, body) {
  const order = String(body.order || ''), tok = String(body.tok || '');
  if (!/^[A-Z0-9]{8,40}$/.test(order) || !tok) return json({ ok: false, why: 'bad' }, 400);
  const uid = await whoIs(tok); if (!uid) return json({ ok: false, why: 'auth' }, 401);
  const used = await db(env, '/paid/' + order); if (used) return json({ ok: used === uid, why: used === uid ? 'done' : 'used' }, used === uid ? 200 : 409);
  const at = await ppToken(env), H = { authorization: 'Bearer ' + at, 'content-type': 'application/json' };
  let o = await (await fetch(ppBase(env) + '/v2/checkout/orders/' + order, { headers: H })).json();
  // approved by the buyer but not collected yet: collect it now (once; PayPal refuses a second capture)
  if (o && o.status === 'APPROVED') o = await (await fetch(ppBase(env) + '/v2/checkout/orders/' + order + '/capture', { method: 'POST', headers: H, body: '{}' })).json();
  const pu = o && o.purchase_units && o.purchase_units[0], cap = pu && pu.payments && pu.payments.captures && pu.payments.captures[0];
  // the order must be completed, captured, for the full price in dollars, and made for this very account
  if (!o || o.status !== 'COMPLETED' || !cap || cap.status !== 'COMPLETED') return json({ ok: false, why: 'unpaid' }, 402);
  if (cap.amount.currency_code !== 'USD' || +cap.amount.value < PRICE - 0.001) return json({ ok: false, why: 'amount' }, 402);
  if (pu.custom_id !== uid) return json({ ok: false, why: 'owner' }, 403);
  await db(env, '/paid/' + order, { method: 'PUT', body: JSON.stringify(uid) });
  await db(env, '/grants/' + uid, { method: 'PUT', body: JSON.stringify({ by: 'paypal', order, ts: { '.sv': 'timestamp' } }) });
  return json({ ok: true });
}

// the game asks for an order: the price and the account it is for are set here, never by the browser
export async function makeOrder(env, body) {
  const uid = await whoIs(String(body.tok || '')); if (!uid) return json({ ok: false, why: 'auth' }, 401);
  const at = await ppToken(env);
  const r = await fetch(ppBase(env) + '/v2/checkout/orders', { method: 'POST', headers: { authorization: 'Bearer ' + at, 'content-type': 'application/json' },
    body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ amount: { currency_code: 'USD', value: PRICE.toFixed(2) }, custom_id: uid, description: 'Sijal - Season Zero pass' }] }) });
  const j = await r.json(); return j && j.id ? json({ ok: true, id: j.id }) : json({ ok: false, why: 'paypal' }, 502);
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/api/pay-config') return json({ clientId: env.PAYPAL_CLIENT_ID || '', env: env.PAYPAL_ENV || 'sandbox', price: PRICE });
    if (u.pathname === '/api/order' && req.method === 'POST') {
      if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET) return json({ ok: false, why: 'setup' }, 503);
      try { return await makeOrder(env, await req.json()); } catch (e) { return json({ ok: false, why: 'error' }, 500); }
    }
    if (u.pathname === '/api/pass' && req.method === 'POST') {
      if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET || !env.FIREBASE_DB_SECRET) return json({ ok: false, why: 'setup' }, 503);
      try { return await claimPass(env, await req.json()); } catch (e) { return json({ ok: false, why: 'error' }, 500); }
    }
    if (u.pathname.startsWith('/api/')) return json({ ok: false, why: 'nope' }, 404);
    return env.ASSETS.fetch(req);
  }
};
