require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

// Run ONCE before enabling PAYMENT_ENABLED, so existing approved users are not
// locked out by the new payment gate. Marks them paymentStatus='paid' with a
// far-future expiry (grandfathered).  Usage:
//   node scripts/grandfatherPaidUsers.js --dry-run
//   node scripts/grandfatherPaidUsers.js --apply

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'APPLY' : 'DRY-RUN');
  const snap = await db.collection('users').get();
  const far = new Date('2099-12-31');
  let target = 0, batch = db.batch(), ops = 0;
  const rows = [];
  snap.forEach(doc => {
    const u = doc.data();
    const approved = (u.approvalStatus === 'approved') || u.isApproved === true || u.role === 'admin';
    if (approved && u.paymentStatus !== 'paid') {
      target++;
      rows.push(`${u.email || doc.id} (${u.role || 'user'})`);
      if (apply) {
        batch.set(doc.ref, { paymentStatus: 'paid', plan: 'grandfathered', paidAt: new Date(), expiresAt: far, updatedAt: new Date() }, { merge: true });
        if (++ops >= 400) { /* commit handled after loop for simplicity */ }
      }
    }
  });
  if (apply) await batch.commit();
  console.log(`ผู้ใช้ที่จะ/ได้ตั้งเป็น paid (grandfathered): ${target} ราย`);
  rows.slice(0, 30).forEach(r => console.log('  • ' + r));
  if (!apply) console.log('\n(ยังไม่เขียน — เพิ่ม --apply เพื่อดำเนินการ)');
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
