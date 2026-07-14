require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

const CATEGORY_NAME = 'ความสามารถทั่วไป';
const SOURCE = 'คิดวิเคราะห์เชิงนามธรรม — อนุกรมภาพ (รูปภาพ/มิติสัมพันธ์)';

// ---------- SVG blocks (100x100 cell) ----------
const norm = a => ((a % 360) + 360) % 360;
const cellBox = () => '<rect x="6" y="6" width="88" height="88" rx="8" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3"/>';
const qMark = () => `${cellBox()}<text x="50" y="68" font-size="52" text-anchor="middle" fill="currentColor" font-family="sans-serif">?</text>`;

const arrowInner = (angle) =>
  `${cellBox()}<g transform="rotate(${angle} 50 50)" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="50" y1="80" x2="50" y2="24"/><polyline points="34,42 50,22 66,42"/></g>`;

const polygonInner = (n) => {
  const cx = 50, cy = 52, r = 36; const pts = [];
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`); }
  return `${cellBox()}<polygon points="${pts.join(' ')}" stroke="currentColor" stroke-width="5" fill="none" stroke-linejoin="round"/>`;
};

const dotsInner = (n) => {
  let d = cellBox(); const perRow = Math.min(n, 4); const rows = Math.ceil(n / perRow); const gx = 18, gy = 18, r = 6;
  for (let row = 0; row < rows; row++) {
    const inThis = Math.min(perRow, n - row * perRow); const startX = 50 - (inThis - 1) * gx / 2; const y = 50 - (rows - 1) * gy / 2 + row * gy;
    for (let c = 0; c < inThis; c++) d += `<circle cx="${startX + c * gx}" cy="${y}" r="${r}" fill="currentColor"/>`;
  }
  return d;
};

// chiral flag: pole + triangle. rot degrees, mx/my = mirror (-1 to flip)
const flagInner = (rot = 0, mx = 1, my = 1) =>
  `${cellBox()}<g transform="rotate(${rot} 50 50) translate(${mx < 0 ? 100 : 0} ${my < 0 ? 100 : 0}) scale(${mx} ${my})" stroke="currentColor" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"><line x1="36" y1="18" x2="36" y2="84"/><polygon points="36,20 68,34 36,48" fill="currentColor"/></g>`;

const figSvg = (inner, size = 82) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const stemSvg = (inners) => {
  const cell = 100, gap = 12; const w = inners.length * cell + (inners.length - 1) * gap; const h = 100; const disp = Math.min(w, 460);
  let g = ''; inners.forEach((inner, i) => { g += `<g transform="translate(${i * (cell + gap)} 0)">${inner}</g>`; });
  return `<svg width="${disp}" height="${(disp * h / w).toFixed(0)}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
};

const matrixSvg = (inners) => {
  const cell = 100, gap = 10; const w = 3 * cell + 2 * gap; const disp = 300;
  let g = ''; for (let i = 0; i < 9; i++) { const r = Math.floor(i / 3), c = i % 3; g += `<g transform="translate(${c * (cell + gap)} ${r * (cell + gap)})">${inners[i]}</g>`; }
  return `<svg width="${disp}" height="${disp}" viewBox="0 0 ${w} ${w}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
};

function shuffleWithCorrect(optionInners, correctIdx) {
  const arr = optionInners.map((o, i) => ({ o, correct: i === correctIdx }));
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return { choiceSvgs: arr.map(x => figSvg(x.o)), ans: arr.findIndex(x => x.correct) };
}

const Q = (fields) => ({ diff: 'medium', ...fields });

// ---------- generators ----------
function mirrorQ(baseInner, correctInner, distractInners, axisText) {
  const { choiceSvgs, ans } = shuffleWithCorrect([correctInner, ...distractInners], 0);
  return Q({ q: `จงเลือกภาพที่เป็น "ภาพสะท้อนในกระจก${axisText}" ของรูปโจทย์`, questionSvg: figSvg(baseInner, 110), choiceSvgs, ans,
    explain: `ภาพสะท้อนในกระจก${axisText} คือการพลิกรูปกลับด้าน${axisText === ' (ซ้าย-ขวา)' ? 'ในแนวซ้าย-ขวา' : 'ในแนวบน-ล่าง'} (ไม่ใช่การหมุน)` });
}

function analogyRotQ(shape1, shape2, step) {
  // shape1: [a,b] inners showing the rule; shape2: c inner + answer inner
  const stem = stemSvg([shape1.a, shape1.b, shape2.c, qMark()]);
  const distract = [norm(step + 90), norm(step + 180), norm(step + 270)].map(shape2.at);
  const { choiceSvgs, ans } = shuffleWithCorrect([shape2.at(norm(step)), ...distract], 0);
  return Q({ q: 'สองรูปแรกสัมพันธ์กันด้วยการหมุน รูปที่สามกับ (?) ก็สัมพันธ์กันแบบเดียวกัน จงเลือกภาพ (?)', questionSvg: stem, choiceSvgs, ans,
    explain: `รูปที่ 1 → รูปที่ 2 คือการหมุน ${step}° รูปที่ 3 จึงต้องหมุน ${step}° เช่นเดียวกัน` });
}

function analogyCountQ(mk, a, b, c, ans, ruleText) {
  const stem = stemSvg([mk(a), mk(b), mk(c), qMark()]);
  const cand = new Set([ans]); const dv = [];
  [ans + 1, ans - 1, ans + 2, ans - 2].forEach(v => { if (v >= 1 && !cand.has(v) && dv.length < 3) { cand.add(v); dv.push(v); } });
  const { choiceSvgs, ans: idx } = shuffleWithCorrect([mk(ans), ...dv.map(mk)], 0);
  return Q({ q: 'สองรูปแรกสัมพันธ์กันอย่างไร รูปที่สามกับ (?) ก็สัมพันธ์แบบเดียวกัน จงเลือกภาพ (?)', questionSvg: stem, choiceSvgs, ans: idx,
    explain: `${ruleText} คำตอบจึงมีค่าเท่ากับ ${ans}` });
}

function matrixCountQ(mk, grid, ans, ruleText) {
  const inners = grid.map(mk); inners.push(qMark());
  const cand = new Set([ans]); const dv = [];
  [ans + 1, ans - 1, ans + 2, ans - 2].forEach(v => { if (v >= 1 && !cand.has(v) && dv.length < 3) { cand.add(v); dv.push(v); } });
  const { choiceSvgs, ans: idx } = shuffleWithCorrect([mk(ans), ...dv.map(mk)], 0);
  return Q({ q: 'จากตาราง 3×3 ต่อไปนี้ แต่ละแถวและหลักมีความสัมพันธ์กัน จงเลือกภาพในช่อง (?)', questionSvg: matrixSvg(inners), choiceSvgs, ans: idx,
    explain: `${ruleText} ช่องมุมขวาล่างจึงมีค่า ${ans}` });
}

function oddOneOutQ(sameInners, oddInner, ruleText) {
  const { choiceSvgs, ans } = shuffleWithCorrect([oddInner, ...sameInners], 0);
  return Q({ q: 'รูปใดแตกต่างจากรูปอื่น', questionSvg: '', choiceSvgs, ans, explain: ruleText });
}

// square with a dot in one corner (0=TL,1=TR,2=BR,3=BL) — rotation states
const sqDot = (corner) => {
  const c = [[28, 28], [72, 28], [72, 72], [28, 72]][corner];
  return `${cellBox()}<rect x="24" y="24" width="52" height="52" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="${c[0]}" cy="${c[1]}" r="7" fill="currentColor"/>`;
};

const QUESTIONS = [
  // ----- ภาพสะท้อน (mirror) -----
  mirrorQ(flagInner(0), flagInner(0, -1, 1), [flagInner(0), flagInner(0, 1, -1), flagInner(180)], ' (ซ้าย-ขวา)'),
  mirrorQ(flagInner(0), flagInner(0, 1, -1), [flagInner(0), flagInner(0, -1, 1), flagInner(180)], ' (บน-ล่าง)'),
  mirrorQ(flagInner(90), flagInner(90, -1, 1), [flagInner(90), flagInner(90, 1, -1), flagInner(270)], ' (ซ้าย-ขวา)'),
  mirrorQ(arrowInner(45), arrowInner(315), [arrowInner(45), arrowInner(135), arrowInner(225)], ' (ซ้าย-ขวา)'),
  mirrorQ(flagInner(180), flagInner(180, -1, 1), [flagInner(180), flagInner(180, 1, -1), flagInner(0)], ' (ซ้าย-ขวา)'),
  mirrorQ(arrowInner(45), arrowInner(135), [arrowInner(45), arrowInner(315), arrowInner(225)], ' (บน-ล่าง)'),

  // ----- analogy 2×2 : หมุน -----
  analogyRotQ({ a: arrowInner(0), b: arrowInner(90) }, { c: flagInner(0), at: (a) => flagInner(a) }, 90),
  analogyRotQ({ a: flagInner(0), b: flagInner(180) }, { c: arrowInner(0), at: (a) => arrowInner(a) }, 180),
  analogyRotQ({ a: sqDot(0), b: sqDot(1) }, { c: arrowInner(0), at: (a) => arrowInner(a) }, 90),
  analogyRotQ({ a: arrowInner(0), b: arrowInner(45) }, { c: flagInner(0), at: (a) => flagInner(a) }, 45),
  analogyRotQ({ a: flagInner(0), b: flagInner(90) }, { c: sqDot(0), at: (a) => sqDot(((a / 90) % 4 + 4) % 4) }, 90),
  analogyRotQ({ a: arrowInner(90), b: arrowInner(180) }, { c: flagInner(90), at: (a) => flagInner(norm(90 + a)) }, 90),

  // ----- analogy 2×2 : นับ -----
  analogyCountQ(polygonInner, 3, 4, 5, 6, 'รูปที่ 2 มีด้านมากกว่ารูปที่ 1 อยู่ 1 ด้าน (กฎ +1)'),
  analogyCountQ(dotsInner, 2, 3, 4, 5, 'จำนวนจุดเพิ่มขึ้นทีละ 1 (กฎ +1)'),
  analogyCountQ(polygonInner, 4, 6, 3, 5, 'รูปที่ 2 มีด้านมากกว่ารูปที่ 1 อยู่ 2 ด้าน (กฎ +2)'),
  analogyCountQ(dotsInner, 1, 3, 2, 4, 'จำนวนจุดเพิ่มขึ้นทีละ 2 (กฎ +2)'),

  // ----- matrix 3×3 : นับ -----
  matrixCountQ(polygonInner, [3, 4, 5, 4, 5, 6, 5, 6], 7, 'จำนวนด้านเพิ่มทีละ 1 ทั้งในแนวขวาและแนวลง'),
  matrixCountQ(dotsInner, [1, 2, 3, 2, 3, 4, 3, 4], 5, 'จำนวนจุดเพิ่มทีละ 1 ทั้งในแนวขวาและแนวลง'),
  matrixCountQ(polygonInner, [4, 5, 6, 5, 6, 7, 6, 7], 8, 'จำนวนด้านเพิ่มทีละ 1 ทั้งในแนวขวาและแนวลง'),
  matrixCountQ(dotsInner, [2, 3, 4, 3, 4, 5, 4, 5], 6, 'จำนวนจุดเพิ่มทีละ 1 ทั้งในแนวขวาและแนวลง'),
  matrixCountQ(polygonInner, [3, 5, 7, 4, 6, 8, 5, 7], 9, 'ในแต่ละแถวจำนวนด้านเพิ่มทีละ 2 และแต่ละหลักเพิ่มทีละ 1'),
  matrixCountQ(dotsInner, [1, 3, 5, 2, 4, 6, 3, 5], 7, 'ในแต่ละแถวจำนวนจุดเพิ่มทีละ 2 และแต่ละหลักเพิ่มทีละ 1'),

  // ----- หารูปที่แตกต่าง (odd one out) -----
  oddOneOutQ([arrowInner(0), arrowInner(0), arrowInner(0)], arrowInner(90), 'สามรูปเป็นลูกศรชี้ขึ้นเหมือนกัน มีเพียงรูปเดียวที่ชี้ไปทางอื่น'),
  oddOneOutQ([polygonInner(4), polygonInner(4), polygonInner(4)], polygonInner(3), 'สามรูปเป็นสี่เหลี่ยม (4 ด้าน) มีเพียงรูปเดียวเป็นสามเหลี่ยม (3 ด้าน)'),
  oddOneOutQ([flagInner(0), flagInner(0), flagInner(0)], flagInner(0, -1, 1), 'สามรูปหันทางเดียวกัน มีเพียงรูปเดียวที่เป็นภาพสะท้อน (หันกลับด้าน)'),
  oddOneOutQ([dotsInner(4), dotsInner(4), dotsInner(4)], dotsInner(5), 'สามรูปมี 4 จุดเท่ากัน มีเพียงรูปเดียวที่มี 5 จุด'),
  oddOneOutQ([polygonInner(5), polygonInner(5), polygonInner(5)], polygonInner(6), 'สามรูปเป็นห้าเหลี่ยม (5 ด้าน) มีเพียงรูปเดียวเป็นหกเหลี่ยม (6 ด้าน)'),
  oddOneOutQ([arrowInner(180), arrowInner(180), arrowInner(180)], arrowInner(0), 'สามรูปเป็นลูกศรชี้ลงเหมือนกัน มีเพียงรูปเดียวที่ชี้ขึ้น'),
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
  console.log(`โหมด: ${dryRun ? 'DRY-RUN' : 'APPLY'} | เตรียม ${QUESTIONS.length} ข้อ (อนุกรมภาพ เฟส 2)`);
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
        choices: labels.slice(), choiceSvgs: q.choiceSvgs,
        ...(q.questionSvg ? { questionSvg: q.questionSvg } : {}),
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
