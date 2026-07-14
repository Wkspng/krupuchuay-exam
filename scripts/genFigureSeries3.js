require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

const CATEGORY_NAME = 'ความสามารถทั่วไป';
const SOURCE = 'คิดวิเคราะห์เชิงนามธรรม — อนุกรมภาพ (รูปภาพ/มิติสัมพันธ์)';

const cellBox = () => '<rect x="6" y="6" width="88" height="88" rx="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>';
const qMark = () => `${cellBox()}<text x="50" y="68" font-size="52" text-anchor="middle" fill="currentColor" font-family="sans-serif">?</text>`;

// ----- shapes -----
const sizeSquareInner = (lv) => { const h = 9 + lv * 6; return `${cellBox()}<rect x="${50 - h}" y="${50 - h}" width="${2 * h}" height="${2 * h}" fill="none" stroke="currentColor" stroke-width="5"/>`; };
const sizeCircleInner = (lv) => { const r = 9 + lv * 6; return `${cellBox()}<circle cx="50" cy="50" r="${r}" fill="none" stroke="currentColor" stroke-width="5"/>`; };
const sizeTriInner = (lv) => { const r = 11 + lv * 6; const p = [0, 1, 2].map(i => { const a = -Math.PI / 2 + i * 2 * Math.PI / 3; return `${(50 + r * Math.cos(a)).toFixed(1)},${(52 + r * Math.sin(a)).toFixed(1)}`; }); return `${cellBox()}<polygon points="${p.join(' ')}" fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/>`; };

const shadeInner = (k) => { const cells = [[26, 26], [52, 26], [26, 52], [52, 52]]; let r = cellBox(); cells.forEach((c, i) => { r += `<rect x="${c[0]}" y="${c[1]}" width="22" height="22" fill="${i < k ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2.5"/>`; }); return r; };

// dot at square corner (0=TL,1=TR,2=BR,3=BL) — clockwise
const sqDotInner = (p) => { const c = [[28, 28], [72, 28], [72, 72], [28, 72]][p]; return `${cellBox()}<rect x="24" y="24" width="52" height="52" fill="none" stroke="currentColor" stroke-width="4.5"/><circle cx="${c[0]}" cy="${c[1]}" r="7" fill="currentColor"/>`; };
// dot at square edge midpoint (0=top,1=right,2=bottom,3=left) — clockwise
const edgeDotInner = (p) => { const c = [[50, 26], [74, 50], [50, 74], [26, 50]][p]; return `${cellBox()}<rect x="26" y="26" width="48" height="48" fill="none" stroke="currentColor" stroke-width="4.5"/><circle cx="${c[0]}" cy="${c[1]}" r="7" fill="currentColor"/>`; };

// circle with inner regular n-gon
const compoundInner = (n) => { const pts = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push(`${(50 + 20 * Math.cos(a)).toFixed(1)},${(52 + 20 * Math.sin(a)).toFixed(1)}`); } return `${cellBox()}<circle cx="50" cy="52" r="34" fill="none" stroke="currentColor" stroke-width="4"/><polygon points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>`; };

const figSvg = (inner, size = 82) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
const stemSvg = (inners) => { const cell = 100, gap = 12; const w = inners.length * cell + (inners.length - 1) * gap; const disp = Math.min(w, 460); let g = ''; inners.forEach((inr, i) => { g += `<g transform="translate(${i * (cell + gap)} 0)">${inr}</g>`; }); return `<svg width="${disp}" height="${(disp * 100 / w).toFixed(0)}" viewBox="0 0 ${w} 100" xmlns="http://www.w3.org/2000/svg">${g}</svg>`; };

function shuffleWithCorrect(optionInners, correctIdx) { const arr = optionInners.map((o, i) => ({ o, correct: i === correctIdx })); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; } return { choiceSvgs: arr.map(x => figSvg(x.o)), ans: arr.findIndex(x => x.correct) }; }
const Q = (f) => ({ diff: 'medium', q: 'จงเลือกภาพที่ควรอยู่ในตำแหน่ง (?) ของอนุกรมภาพต่อไปนี้', ...f });

// ----- generators -----
// pick the 3 nearest valid values (in range) as distractors — never short
const nearest3 = (next, lo, hi) => {
  const pool = []; for (let v = lo; v <= hi; v++) if (v !== next) pool.push(v);
  return pool.sort((a, b) => Math.abs(a - next) - Math.abs(b - next) || a - b).slice(0, 3);
};

function sizeQ(mk, levels, next, shapeText) {
  const stem = stemSvg([...levels.map(mk), qMark()]);
  const dv = nearest3(next, 1, 6);
  const { choiceSvgs, ans } = shuffleWithCorrect([mk(next), ...dv.map(mk)], 0);
  const grow = next > levels[levels.length - 1];
  return Q({ questionSvg: stem, choiceSvgs, ans, explain: `${shapeText}มีขนาด${grow ? 'ใหญ่ขึ้น' : 'เล็กลง'}อย่างสม่ำเสมอในแต่ละขั้น ภาพถัดไปจึง${grow ? 'ใหญ่กว่า' : 'เล็กกว่า'}ภาพสุดท้าย` });
}
function shadeQ(ks, next) {
  const stem = stemSvg([...ks.map(shadeInner), qMark()]);
  const dv = nearest3(next, 0, 4);
  const { choiceSvgs, ans } = shuffleWithCorrect([shadeInner(next), ...dv.map(shadeInner)], 0);
  const inc = next > ks[ks.length - 1];
  return Q({ questionSvg: stem, choiceSvgs, ans, explain: `จำนวนช่องที่ถูกระบายทึบ${inc ? 'เพิ่มขึ้น' : 'ลดลง'}ทีละ 1 ช่อง ภาพถัดไปจึงมี ${next} ช่องที่ระบาย` });
}
function positionQ(mk, ps, next, dirText, frameText) {
  const stem = stemSvg([...ps.map(mk), qMark()]);
  const distract = [0, 1, 2, 3].filter(x => x !== next).slice(0, 3);
  const { choiceSvgs, ans } = shuffleWithCorrect([mk(next), ...distract.map(mk)], 0);
  return Q({ questionSvg: stem, choiceSvgs, ans, explain: `จุดเคลื่อนที่${dirText}ไปตาม${frameText}ทีละตำแหน่งในแต่ละขั้น` });
}
function compoundQ(ns, next, ruleText) {
  const stem = stemSvg([...ns.map(compoundInner), qMark()]);
  const dv = nearest3(next, 3, 12);
  const { choiceSvgs, ans } = shuffleWithCorrect([compoundInner(next), ...dv.map(compoundInner)], 0);
  return Q({ questionSvg: stem, choiceSvgs, ans, explain: `${ruleText} รูปหลายเหลี่ยมด้านในถัดไปจึงมี ${next} ด้าน` });
}

const QUESTIONS = [
  // ขนาด
  sizeQ(sizeSquareInner, [1, 2, 3], 4, 'รูปสี่เหลี่ยม'),
  sizeQ(sizeCircleInner, [2, 3, 4], 5, 'วงกลม'),
  sizeQ(sizeSquareInner, [5, 4, 3], 2, 'รูปสี่เหลี่ยม'),
  sizeQ(sizeTriInner, [1, 2, 3], 4, 'รูปสามเหลี่ยม'),
  sizeQ(sizeCircleInner, [4, 3, 2], 1, 'วงกลม'),
  sizeQ(sizeTriInner, [2, 3, 4], 5, 'รูปสามเหลี่ยม'),
  // ระบายทึบ
  shadeQ([1, 2, 3], 4),
  shadeQ([0, 1, 2], 3),
  shadeQ([4, 3, 2], 1),
  shadeQ([3, 2, 1], 0),
  // จุดเคลื่อนที่
  positionQ(sqDotInner, [0, 1, 2], 3, 'ตามเข็มนาฬิกา', 'มุมของสี่เหลี่ยม'),
  positionQ(sqDotInner, [0, 3, 2], 1, 'ทวนเข็มนาฬิกา', 'มุมของสี่เหลี่ยม'),
  positionQ(edgeDotInner, [0, 1, 2], 3, 'ตามเข็มนาฬิกา', 'กลางด้านของสี่เหลี่ยม'),
  positionQ(edgeDotInner, [3, 2, 1], 0, 'ทวนเข็มนาฬิกา', 'กลางด้านของสี่เหลี่ยม'),
  positionQ(sqDotInner, [1, 2, 3], 0, 'ตามเข็มนาฬิกา', 'มุมของสี่เหลี่ยม'),
  // รูปซ้อน (วงกลมซ้อนรูปหลายเหลี่ยม)
  compoundQ([3, 4, 5], 6, 'รูปหลายเหลี่ยมด้านในมีจำนวนด้านเพิ่มขึ้นทีละ 1'),
  compoundQ([4, 5, 6], 7, 'รูปหลายเหลี่ยมด้านในมีจำนวนด้านเพิ่มขึ้นทีละ 1'),
  compoundQ([6, 5, 4], 3, 'รูปหลายเหลี่ยมด้านในมีจำนวนด้านลดลงทีละ 1'),
  compoundQ([3, 5, 7], 9, 'รูปหลายเหลี่ยมด้านในมีจำนวนด้านเพิ่มขึ้นทีละ 2'),
  compoundQ([4, 6, 8], 10, 'รูปหลายเหลี่ยมด้านในมีจำนวนด้านเพิ่มขึ้นทีละ 2'),
];

async function findCategoryId() {
  const snap = await db.collection('categories').get();
  let id = null;
  snap.forEach(doc => { if (String(doc.data().name || '').trim() === CATEGORY_NAME) id = doc.id; });
  if (!id) throw new Error(`ไม่พบ category "${CATEGORY_NAME}"`);
  return id;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`โหมด: ${dryRun ? 'DRY-RUN' : 'APPLY'} | เตรียม ${QUESTIONS.length} ข้อ (อนุกรมภาพ เฟส 3)`);
  QUESTIONS.forEach((q, i) => {
    if (!Array.isArray(q.choiceSvgs) || q.choiceSvgs.length !== 4) throw new Error(`ข้อ ${i}: choiceSvgs ต้องมี 4`);
    if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) throw new Error(`ข้อ ${i}: ans 0-3 (ได้ ${q.ans})`);
  });
  const categoryId = await findCategoryId();
  console.log(`✅ ${CATEGORY_NAME} (${categoryId})`);
  const existingSnap = await db.collection('questions').where('categoryId', '==', categoryId).get();
  const existing = new Set();
  existingSnap.forEach(d => { const x = d.data(); existing.add((x.questionText || '').trim().toLowerCase() + '|' + (x.choiceSvgs ? x.choiceSvgs.join('') : '')); });

  let imported = 0, skipped = 0, batch = db.batch(), ops = 0;
  const labels = ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'];
  for (const q of QUESTIONS) {
    const key = q.q.trim().toLowerCase() + '|' + q.choiceSvgs.join('');
    if (existing.has(key)) { skipped++; continue; }
    existing.add(key);
    if (!dryRun) {
      const ref = db.collection('questions').doc();
      batch.set(ref, {
        categoryId, categoryName: CATEGORY_NAME, questionText: q.q.trim(),
        choices: labels.slice(), choiceSvgs: q.choiceSvgs, questionSvg: q.questionSvg,
        correctAnswerIndex: q.ans, explanation: q.explain, difficulty: q.diff || 'medium',
        source: SOURCE, topic: 'อนุกรมภาพ',
        isActive: true, createdAt: new Date(), updatedAt: new Date(), legacyMongoId: null,
      });
      if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    }
    imported++;
  }
  if (!dryRun && ops > 0) await batch.commit();
  console.log(`\n✅ ${dryRun ? 'จะเพิ่ม' : 'เพิ่มแล้ว'} ${imported} ข้อ | ข้ามซ้ำ ${skipped}`);
  if (!dryRun) console.log(`\n⚠️  recompile: node scripts/compileExamPacks.js --apply --categoryId ${categoryId}`);
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
