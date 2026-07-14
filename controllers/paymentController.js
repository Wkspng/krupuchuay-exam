const QRCode = require('qrcode');
const paymentService = require('../services/paymentService');
const { db } = require('../src/firebaseAdmin');

function isPaidActive(u) {
  if (!u || u.paymentStatus !== 'paid') return false;
  if (!u.expiresAt) return true;
  const exp = u.expiresAt.toDate ? u.expiresAt.toDate() : new Date(u.expiresAt);
  return exp > new Date();
}

async function getConfig(req, res) {
  const info = paymentService.getPaymentInfo();
  if (!info.enabled) return res.json({ enabled: false });
  let qrDataUrl = null;
  if (info.qrPayload) {
    try { qrDataUrl = await QRCode.toDataURL(info.qrPayload, { width: 320, margin: 1 }); }
    catch (e) { console.warn('QR generation failed:', e.message); }
  }
  return res.json({ ...info, qrDataUrl });
}

async function getStatus(req, res) {
  try {
    const doc = await db.collection('users').doc(req.user.uid).get();
    const u = doc.exists ? doc.data() : {};
    return res.json({
      paymentStatus: u.paymentStatus || 'unpaid',
      paid: isPaidActive(u),
      expiresAt: u.expiresAt ? (u.expiresAt.toDate ? u.expiresAt.toDate() : u.expiresAt) : null,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load payment status' });
  }
}

async function verifySlip(req, res) {
  const { imageBase64, slipRef } = req.body || {};
  let result;
  try {
    result = await paymentService.processSlip(req.user.uid, { imageBase64, dataRef: slipRef });
  } catch (error) {
    console.error('verifySlip error:', error);
    return res.status(500).json({ success: false, error: 'ระบบตรวจสอบสลิปขัดข้อง กรุณาลองใหม่' });
  }
  if (result.ok) {
    return res.json({ success: true, expiresAt: result.expiresAt, message: 'ชำระเงินสำเร็จ เปิดใช้งานบัญชีแล้ว' });
  }
  const msgs = {
    disabled: 'ระบบชำระเงินยังไม่เปิดใช้งาน',
    not_configured: 'ระบบชำระเงินยังตั้งค่าไม่ครบ กรุณาติดต่อผู้ดูแล',
    invalid_slip: 'ข้อมูลสลิปไม่ถูกต้อง',
    provider_error: 'ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่',
    verify_failed: 'ไม่พบข้อมูลการชำระเงินจากสลิปนี้ กรุณาตรวจสอบอีกครั้ง',
    amount_mismatch: 'ยอดเงินในสลิปไม่ถูกต้อง',
    slip_used: 'สลิปนี้ถูกใช้ไปแล้ว กรุณาใช้สลิปการโอนใหม่',
  };
  const code = result.code === 'not_configured' || result.code === 'disabled' ? 503 : 400;
  return res.status(code).json({ success: false, code: result.code, error: msgs[result.code] || 'ตรวจสอบสลิปไม่สำเร็จ' });
}

module.exports = { getConfig, getStatus, verifySlip };
