require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

// ลบข้อสอบซ้ำ (soft-delete: isActive=false) โดยถือว่า "ซ้ำ" เมื่อ
//   1) ชุดตัวเลือก (เรียงแล้ว) + ข้อความเฉลย เหมือนกันเป๊ะ  และ
//   2) โจทย์คล้ายกันมาก (prefix+suffix ที่ตรงกัน ≥ 55% ของความยาว)
// เก็บข้อที่โจทย์ยาว/สมบูรณ์กว่าไว้ ลบตัวที่เหลือ

const norm = s => String(s || '').toLowerCase().replace(/[\s"'?.,ๆ!()]/g, '').trim();

// Levenshtein edit distance -> similarity ratio ทั้งประโยค (จับความต่างตรงกลางได้
// เช่นสมการคณิตที่ต่างกัน จะได้ค่าต่ำ ไม่ถูกตัดสินว่าซ้ำ)
function similarity(a, b) {
  if (!a.length || !b.length) return 0;
  if (a === b) return 1;
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 1; j <= n; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= m; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(
        dp[i] + 1,
        dp[i - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      prev = tmp;
    }
  }
  return 1 - dp[m] / Math.max(m, n);
}

const tIdx = process.argv.indexOf('--threshold');
const SIM_THRESHOLD = tIdx !== -1 ? parseFloat(process.argv[tIdx + 1]) : 0.75;

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const idx = process.argv.indexOf('--categoryId');
  const categoryId = idx !== -1 ? process.argv[idx + 1] : null;
  const all = process.argv.includes('--all');
  if (!categoryId && !all) {
    console.log('ใช้: node scripts/dedupeQuestions.js --categoryId <id> [--apply]');
    console.log('หรือ: node scripts/dedupeQuestions.js --all [--apply]');
    process.exit(1);
  }
  console.log(`โหมด: ${dryRun ? 'DRY-RUN (ไม่ลบจริง)' : 'APPLY (soft-delete จริง)'}`);

  let catIds = [];
  if (all) {
    const cs = await db.collection('categories').get();
    catIds = cs.docs.map(d => d.id);
  } else {
    catIds = [categoryId];
  }

  let totalDup = 0;
  const toDeactivate = [];

  for (const cid of catIds) {
    const snap = await db.collection('questions').where('categoryId', '==', cid).where('isActive', '==', true).get();
    if (snap.empty) continue;

    // group by choices+answer key
    const groups = new Map();
    snap.forEach(d => {
      const q = d.data();
      const choices = (q.choices || []);
      const ck = choices.map(norm).sort().join('|') + '#' + norm(choices[q.correctAnswerIndex]);
      if (!groups.has(ck)) groups.set(ck, []);
      groups.get(ck).push({ id: d.id, text: q.questionText || '', ntext: norm(q.questionText), catName: q.categoryName });
    });

    for (const items of groups.values()) {
      if (items.length < 2) continue;
      // survivors[]: หนึ่งตัวต่อกลุ่มย่อยที่คล้ายกัน
      const survivors = [];
      for (const it of items) {
        const match = survivors.find(s => similarity(s.ntext, it.ntext) >= SIM_THRESHOLD);
        if (!match) { survivors.push(it); continue; }
        // เก็บตัวที่โจทย์ยาวกว่า
        if (it.text.length > match.text.length) {
          toDeactivate.push({ ...match, keep: it.text });
          match.id = it.id; match.text = it.text; match.ntext = it.ntext; // survivor กลายเป็นตัวใหม่
        } else {
          toDeactivate.push({ ...it, keep: match.text });
        }
      }
    }
  }

  totalDup = toDeactivate.length;
  console.log(`\nพบข้อซ้ำที่จะปิดใช้งาน: ${totalDup} ข้อ`);
  toDeactivate.slice(0, 30).forEach((d, i) =>
    console.log(`  ${i + 1}. ลบ: "${d.text.slice(0, 55)}"\n      เก็บ: "${d.keep.slice(0, 55)}"`));
  if (totalDup > 30) console.log(`  ... และอีก ${totalDup - 30} ข้อ`);

  if (!dryRun && totalDup > 0) {
    let batch = db.batch(), ops = 0;
    for (const d of toDeactivate) {
      batch.update(db.collection('questions').doc(d.id), { isActive: false, updatedAt: new Date() });
      if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    }
    if (ops > 0) await batch.commit();
    console.log(`\n✅ ปิดใช้งาน ${totalDup} ข้อแล้ว`);
    const affected = [...new Set(catIds)];
    console.log(`\n⚠️  recompile pack หมวดที่กระทบด้วย เช่น:\n   node scripts/compileExamPacks.js --apply --categoryId ${categoryId || '<id>'}`);
  } else if (dryRun) {
    console.log('\n(ยังไม่ลบจริง — เพิ่ม --apply เพื่อดำเนินการ)');
  }
  process.exit(0);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
