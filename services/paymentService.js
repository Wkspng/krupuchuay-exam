const { db } = require('../src/firebaseAdmin');
const { promptPayPayload } = require('./promptpay');

// All payment settings come from env so no secrets live in the repo.
function CONFIG() {
  return {
    enabled: process.env.PAYMENT_ENABLED === 'true',
    promptPayId: process.env.PROMPTPAY_ID || '',
    amount: Number(process.env.PAYMENT_AMOUNT || 159),
    plan: process.env.PAYMENT_PLAN || 'yearly',
    slipOkApiKey: process.env.SLIPOK_API_KEY || '',
    slipOkBranchId: process.env.SLIPOK_BRANCH_ID || '',
    slipOkUrl: process.env.SLIPOK_URL || 'https://api.slipok.com/api/line/apikey',
  };
}

function getPaymentInfo() {
  const c = CONFIG();
  return {
    enabled: c.enabled,
    amount: c.amount,
    plan: c.plan,
    configured: !!(c.promptPayId && c.slipOkApiKey && c.slipOkBranchId),
    qrPayload: c.promptPayId ? promptPayPayload(c.promptPayId, c.amount) : null,
  };
}

// Grant paid access for 1 year (also flips approvalStatus so the existing login
// gate passes — payment replaces manual approval).
async function grantPaidAccess(uid, transRef) {
  const c = CONFIG();
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  await db.collection('users').doc(uid).set({
    paymentStatus: 'paid',
    plan: c.plan,
    amount: c.amount,
    paidAt: now,
    expiresAt,
    paymentRef: transRef || null,
    approvalStatus: 'approved',
    isApproved: true,
    updatedAt: now,
  }, { merge: true });
  return { expiresAt };
}

// Call the slip-verification provider (SlipOK). Accepts either a slip image
// (base64) sent as multipart `files`, or a QR data string sent as `data`.
async function verifySlipWithProvider({ imageBase64, dataRef }) {
  const c = CONFIG();
  const url = `${c.slipOkUrl}/${c.slipOkBranchId}`;
  const headers = { 'x-authorization': c.slipOkApiKey };
  let body;
  if (imageBase64) {
    const b64 = String(imageBase64).replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(b64, 'base64');
    const form = new FormData();
    form.append('files', new Blob([buf], { type: 'image/jpeg' }), 'slip.jpg');
    form.append('log', 'true');
    form.append('amount', String(c.amount));
    body = form; // fetch sets the multipart boundary automatically
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify({ data: dataRef, log: true, amount: c.amount });
  }
  const resp = await fetch(url, { method: 'POST', headers, body });
  return resp.json().catch(() => ({}));
}

async function processSlip(uid, input) {
  const c = CONFIG();
  if (!c.enabled) return { ok: false, code: 'disabled' };
  if (!c.promptPayId || !c.slipOkApiKey || !c.slipOkBranchId) return { ok: false, code: 'not_configured' };
  const hasImage = input && typeof input.imageBase64 === 'string' && input.imageBase64.length > 0;
  const hasData = input && typeof input.dataRef === 'string' && input.dataRef.length > 0;
  if (!hasImage && !hasData) return { ok: false, code: 'invalid_slip' };

  let result;
  try { result = await verifySlipWithProvider(input); }
  catch (e) { return { ok: false, code: 'provider_error', message: e.message }; }

  // NOTE: adjust these field paths to SlipOK's exact response shape.
  const data = (result && (result.data || result)) || {};
  const success = !!(result && (result.success === true || result.status === 200)) || !!data.transRef;
  const amount = Number(data.amount ?? data.amountValue ?? data.paidAmount);
  const transRef = data.transRef || data.ref || data.transactionId || data.transReff;

  if (!success || !transRef) return { ok: false, code: 'verify_failed' };
  if (!(amount >= c.amount)) return { ok: false, code: 'amount_mismatch', amount };

  // Anti-replay: each slip (by transRef) can be used only once.
  const slipDoc = db.collection('paymentSlips').doc(String(transRef));
  const existing = await slipDoc.get();
  if (existing.exists) return { ok: false, code: 'slip_used' };
  await slipDoc.set({ uid, amount, transRef: String(transRef), usedAt: new Date() });

  const { expiresAt } = await grantPaidAccess(uid, String(transRef));
  return { ok: true, expiresAt, amount };
}

module.exports = { CONFIG, getPaymentInfo, grantPaidAccess, processSlip };
