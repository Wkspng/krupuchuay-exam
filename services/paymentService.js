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

// Call the slip-verification provider (SlipOK). `slipRef` is the QR data read
// from the transfer slip (or a ref string) submitted by the client.
async function verifySlipWithProvider(slipRef) {
  const c = CONFIG();
  const url = `${c.slipOkUrl}/${c.slipOkBranchId}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-authorization': c.slipOkApiKey },
    body: JSON.stringify({ data: slipRef, log: true }),
  });
  return resp.json().catch(() => ({}));
}

async function processSlip(uid, slipRef) {
  const c = CONFIG();
  if (!c.enabled) return { ok: false, code: 'disabled' };
  if (!c.promptPayId || !c.slipOkApiKey || !c.slipOkBranchId) return { ok: false, code: 'not_configured' };
  if (!slipRef || typeof slipRef !== 'string') return { ok: false, code: 'invalid_slip' };

  let result;
  try { result = await verifySlipWithProvider(slipRef); }
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
