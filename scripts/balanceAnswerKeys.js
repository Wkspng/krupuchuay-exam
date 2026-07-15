require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

// Re-shuffle each question's choices so the correct answer is spread evenly
// across ก/ข/ค/ง. The answer TEXT never changes — only its position — so
// correctness is preserved.  Usage:
//   node scripts/balanceAnswerKeys.js --dry-run
//   node scripts/balanceAnswerKeys.js --apply

// Options whose meaning is tied to their letter/position — never reorder these.
const LOCK_PATTERNS = [
  /เพียงข้อเดียวเพียงพอ/,          // data sufficiency (standard ก-ง meanings)
  /ปริมาณ ก มากกว่าปริมาณ ข/,      // quantitative comparison (standard)
];
// "catch-all" options conventionally stay last — skip those questions entirely.
const CATCHALL = /(สรุปไม่ได้|ข้อมูลไม่เพียงพอ|ไม่มีข้อใดถูก|ถูกทุกข้อ|ถูกทั้งหมด|ผิดทุกข้อ|ไม่มีเดือนใด|ไม่มีวิชาใด)/;

function isLocked(q) {
  if (Array.isArray(q.choiceSvgs) && q.choiceSvgs.length) return 'figure';   // already randomised by generator
  const joined = (q.choices || []).join(' | ');
  if (LOCK_PATTERNS.some(re => re.test(joined))) return 'standard-options';
  if (CATCHALL.test(joined)) return 'catch-all';
  return null;
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'APPLY (จะเขียนจริง)' : 'DRY-RUN');

  const snap = await db.collection('questions').where('isActive', '==', true).get();
  const all = [];
  snap.forEach(d => all.push({ ref: d.ref, id: d.id, ...d.data() }));

  const locked = [], target = [];
  const lockReasons = {};
  for (const q of all) {
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || !Number.isInteger(q.correctAnswerIndex)) continue;
    const reason = isLocked(q);
    if (reason) { locked.push(q); lockReasons[reason] = (lockReasons[reason] || 0) + 1; }
    else target.push(q);
  }

  // How many correct answers each letter already has among the locked questions
  const lockedCounts = [0, 0, 0, 0];
  locked.forEach(q => lockedCounts[q.correctAnswerIndex]++);

  const totalUsable = locked.length + target.length;
  const ideal = totalUsable / 4;

  // Desired number of shuffleable questions per letter so the TOTAL evens out
  let need = [0, 1, 2, 3].map(i => Math.max(0, Math.round(ideal - lockedCounts[i])));
  let diff = target.length - need.reduce((a, b) => a + b, 0);
  for (let i = 0; diff !== 0; i = (i + 1) % 4) { // fix rounding drift
    if (diff > 0) { need[i]++; diff--; } else if (need[i] > 0) { need[i]--; diff++; }
  }

  // Build a balanced, randomly-ordered list of target letters
  const targets = [];
  need.forEach((count, idx) => { for (let k = 0; k < count; k++) targets.push(idx); });
  const shuffledTargets = shuffled(targets);
  const order = shuffled(target);

  const updates = [];
  order.forEach((q, i) => {
    const want = shuffledTargets[i];
    const correctText = q.choices[q.correctAnswerIndex];
    let choices = shuffled(q.choices);            // randomise all option positions
    const at = choices.indexOf(correctText);
    [choices[at], choices[want]] = [choices[want], choices[at]];   // move correct answer to its target letter
    if (choices[want] !== correctText) return;    // safety: skip if anything looks off
    updates.push({ ref: q.ref, choices, correctAnswerIndex: want });
  });

  // Report projected distribution
  const projected = [...lockedCounts];
  updates.forEach(u => projected[u.correctAnswerIndex]++);
  const L = ['ก', 'ข', 'ค', 'ง'];
  console.log(`\nข้อที่ใช้ได้: ${totalUsable} | ล็อกไว้ ${locked.length} | จะสลับ ${updates.length}`);
  console.log('ล็อกเพราะ:', JSON.stringify(lockReasons));
  console.log('\n=== สัดส่วนหลังสลับ (คาดการณ์) ===');
  projected.forEach((c, i) => console.log('  ' + L[i] + ': ' + String(c).padStart(4) + '  (' + (c / totalUsable * 100).toFixed(1) + '%)'));

  if (!apply) { console.log('\n(ยังไม่เขียน — เพิ่ม --apply)'); process.exit(0); }

  let batch = db.batch(), ops = 0, done = 0;
  for (const u of updates) {
    batch.update(u.ref, { choices: u.choices, correctAnswerIndex: u.correctAnswerIndex, updatedAt: new Date() });
    if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    done++;
  }
  if (ops > 0) await batch.commit();
  console.log(`\n✅ อัปเดตแล้ว ${done} ข้อ`);
  console.log('\n⚠️  ต้อง recompile exam packs ทุกหมวด (ตัวเลือกเปลี่ยน):');
  console.log('   node scripts/compileExamPacks.js --apply --all');
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
