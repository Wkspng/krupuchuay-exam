require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

const CATEGORY_NAME = 'ความสามารถทั่วไป';
const SOURCE = 'คิดวิเคราะห์เชิงนามธรรม — อนุกรมภาพ (รูปภาพ/มิติสัมพันธ์)';

// ---------- SVG building blocks (100x100 coordinate cell) ----------
const norm = a => ((a % 360) + 360) % 360;
const cellBox = () => '<rect x="6" y="6" width="88" height="88" rx="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>';
const qMark = () => `${cellBox()}<text x="50" y="68" font-size="52" text-anchor="middle" fill="currentColor" font-family="sans-serif">?</text>`;

// arrow pointing up by default, rotated clockwise by `angle`
const arrowInner = (angle) =>
  `${cellBox()}<g transform="rotate(${angle} 50 50)" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="50" y1="80" x2="50" y2="24"/><polyline points="34,42 50,22 66,42"/></g>`;

// regular polygon with n sides
const polygonInner = (n) => {
  const cx = 50, cy = 52, r = 36; const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `${cellBox()}<polygon points="${pts.join(' ')}" stroke="currentColor" stroke-width="5" fill="none" stroke-linejoin="round"/>`;
};

// n dots arranged in a centered grid (max 4 per row)
const dotsInner = (n) => {
  let d = cellBox(); const perRow = Math.min(n, 4); const rows = Math.ceil(n / perRow);
  const gx = 18, gy = 18, r = 6;
  for (let row = 0; row < rows; row++) {
    const inThis = Math.min(perRow, n - row * perRow);
    const startX = 50 - (inThis - 1) * gx / 2;
    const y = 50 - (rows - 1) * gy / 2 + row * gy;
    for (let c = 0; c < inThis; c++) d += `<circle cx="${startX + c * gx}" cy="${y}" r="${r}" fill="currentColor"/>`;
  }
  return d;
};

const figSvg = (inner, size = 82) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

// wide SVG: a row of cells (given figures + ? box)
const stemSvg = (inners) => {
  const cell = 100, gap = 12; const w = inners.length * cell + (inners.length - 1) * gap;
  const h = 100; const disp = Math.min(w, 440);
  let g = '';
  inners.forEach((inner, i) => { g += `<g transform="translate(${i * (cell + gap)} 0)">${inner}</g>`; });
  return `<svg width="${disp}" height="${disp * h / w}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
};

function shuffleWithCorrect(options, correctIdx) {
  const arr = options.map((o, i) => ({ o, correct: i === correctIdx }));
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return { choiceSvgs: arr.map(x => figSvg(x.o)), ans: arr.findIndex(x => x.correct) };
}

// ---------- question generators ----------
function rotationQ(start, step, dirText) {
  const angles = [0, 1, 2].map(k => norm(start + k * step));
  const next = norm(start + 3 * step);
  const stem = stemSvg([...angles.map(arrowInner), qMark()]);
  const distract = [norm(next + 90), norm(next + 180), norm(next + 270)];
  const optionInners = [arrowInner(next), ...distract.map(arrowInner)];
  const { choiceSvgs, ans } = shuffleWithCorrect(optionInners, 0);
  return {
    q: 'จงเลือกภาพที่ควรอยู่ในตำแหน่ง (?) ของอนุกรมภาพต่อไปนี้',
    questionSvg: stem, choiceSvgs, ans, diff: 'medium',
    explain: `ลูกศรหมุน${dirText}ทีละ ${Math.abs(step)}° ในแต่ละขั้น ภาพถัดไปจึงหันไปในทิศที่หมุนต่ออีก ${Math.abs(step)}° จากภาพสุดท้าย`,
  };
}

function polygonCountQ(ns, nextN, ruleText) {
  const stem = stemSvg([...ns.map(polygonInner), qMark()]);
  const cand = new Set([nextN]); const distractVals = [];
  [nextN + 1, nextN - 1, nextN + 2, nextN - 2, ns[0]].forEach(v => { if (v >= 3 && !cand.has(v) && distractVals.length < 3) { cand.add(v); distractVals.push(v); } });
  const optionInners = [polygonInner(nextN), ...distractVals.map(polygonInner)];
  const { choiceSvgs, ans } = shuffleWithCorrect(optionInners, 0);
  return {
    q: 'จงเลือกภาพที่ควรอยู่ในตำแหน่ง (?) ของอนุกรมภาพต่อไปนี้',
    questionSvg: stem, choiceSvgs, ans, diff: 'medium',
    explain: `${ruleText} รูปหลายเหลี่ยมถัดไปจึงมี ${nextN} ด้าน`,
  };
}

function dotsCountQ(ns, nextN, ruleText) {
  const stem = stemSvg([...ns.map(dotsInner), qMark()]);
  const cand = new Set([nextN]); const distractVals = [];
  [nextN + 1, nextN - 1, nextN + 2, nextN - 2].forEach(v => { if (v >= 1 && !cand.has(v) && distractVals.length < 3) { cand.add(v); distractVals.push(v); } });
  const optionInners = [dotsInner(nextN), ...distractVals.map(dotsInner)];
  const { choiceSvgs, ans } = shuffleWithCorrect(optionInners, 0);
  return {
    q: 'จงเลือกภาพที่ควรอยู่ในตำแหน่ง (?) ของอนุกรมภาพต่อไปนี้',
    questionSvg: stem, choiceSvgs, ans, diff: 'easy',
    explain: `${ruleText} ภาพถัดไปจึงมีจุด ${nextN} จุด`,
  };
}

const QUESTIONS = [
  rotationQ(0, 90, 'ตามเข็มนาฬิกา'),
  rotationQ(90, 90, 'ตามเข็มนาฬิกา'),
  rotationQ(0, -90, 'ทวนเข็มนาฬิกา'),
  rotationQ(45, 90, 'ตามเข็มนาฬิกา'),
  rotationQ(0, 45, 'ตามเข็มนาฬิกา'),
  rotationQ(180, 90, 'ตามเข็มนาฬิกา'),
  polygonCountQ([3, 4, 5], 6, 'จำนวนด้านเพิ่มขึ้นทีละ 1 (สามเหลี่ยม 3 → สี่เหลี่ยม 4 → ห้าเหลี่ยม 5 →)'),
  polygonCountQ([4, 5, 6], 7, 'จำนวนด้านเพิ่มขึ้นทีละ 1'),
  polygonCountQ([6, 5, 4], 3, 'จำนวนด้านลดลงทีละ 1'),
  polygonCountQ([3, 5, 7], 9, 'จำนวนด้านเพิ่มขึ้นทีละ 2'),
  dotsCountQ([1, 2, 3], 4, 'จำนวนจุดเพิ่มขึ้นทีละ 1'),
  dotsCountQ([2, 4, 6], 8, 'จำนวนจุดเพิ่มขึ้นทีละ 2'),
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
  console.log(`โหมด: ${dryRun ? 'DRY-RUN' : 'APPLY'} | เตรียม ${QUESTIONS.length} ข้อ (อนุกรมภาพ SVG)`);
  QUESTIONS.forEach((q, i) => {
    if (!q.questionSvg) throw new Error(`ข้อ ${i}: ไม่มี questionSvg`);
    if (!Array.isArray(q.choiceSvgs) || q.choiceSvgs.length !== 4) throw new Error(`ข้อ ${i}: choiceSvgs ต้องมี 4`);
    if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) throw new Error(`ข้อ ${i}: ans 0-3`);
  });

  const categoryId = await findCategoryId();
  console.log(`✅ ${CATEGORY_NAME} (${categoryId})`);
  const existingSnap = await db.collection('questions').where('categoryId', '==', categoryId).get();
  const existing = new Set();
  existingSnap.forEach(d => existing.add(String(d.data().questionText || '').trim().toLowerCase() + '|' + String(d.data().questionSvg || '').length));

  let imported = 0, skipped = 0, batch = db.batch(), ops = 0, n = 0;
  const labels = ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'];
  for (const q of QUESTIONS) {
    const key = q.q.trim().toLowerCase() + '|' + q.questionSvg.length;
    if (existing.has(key)) { skipped++; continue; }
    if (!dryRun) {
      const ref = db.collection('questions').doc();
      batch.set(ref, {
        categoryId, categoryName: CATEGORY_NAME,
        questionText: q.q.trim(),
        choices: labels.slice(),          // alt text (SVG is shown instead)
        choiceSvgs: q.choiceSvgs,
        questionSvg: q.questionSvg,
        correctAnswerIndex: q.ans,
        explanation: q.explain,
        difficulty: q.diff || 'medium',
        source: SOURCE, topic: 'อนุกรมภาพ',
        isActive: true, createdAt: new Date(), updatedAt: new Date(), legacyMongoId: null,
      });
      if (++ops >= 400) { await batch.commit(); batch = db.batch(); ops = 0; }
    }
    imported++; n++;
  }
  if (!dryRun && ops > 0) await batch.commit();
  console.log(`\n✅ ${dryRun ? 'จะเพิ่ม' : 'เพิ่มแล้ว'} ${imported} ข้อ | ข้ามซ้ำ ${skipped}`);
  if (!dryRun) console.log(`\n⚠️  recompile: node scripts/compileExamPacks.js --apply --categoryId ${categoryId}`);
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
