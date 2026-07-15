require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

// Create two full-length ภาค ก mock exam sets that follow the real blueprint:
//   วิชา 1 คิดวิเคราะห์ 100 ข้อ | วิชา 2 อังกฤษ 50 ข้อ | วิชา 3 ข้าราชการที่ดี 50 ข้อ
//   = 200 ข้อ / 300 นาที / ผ่าน 60% (120 คะแนน)
// Usage: node scripts/seedRealExamSets.js [--dry-run|--apply]

const CAT = {
  general: { id: '6a39436fc2e97ab3a084bc03', name: 'ความสามารถทั่วไป' },
  thaiRead: { id: 'mvTymVJoIy3u9TVrAz99', name: 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)' },
  english: { id: 'VWmY01Rh4BepkdUdABoR', name: 'ภาษาอังกฤษพื้นฐาน' },
  civil: { id: 'ZDsmRyUzRsHwLHASHRYD', name: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี' },
  law: { id: '6a394374c2e97ab3a084bc0f', name: 'รัฐธรรมนูญและกฎหมายการศึกษา' },
  social: { id: '6a39437ec2e97ab3a084bc1e', name: 'สังคม เศรษฐกิจ การเมือง บ้านเมือง' },
  policy: { id: 'prvGYuI5U0utpnFONf0E', name: 'นโยบายรัฐ / ปฏิรูปการศึกษา' },
  teacher: { id: '6a39437ac2e97ab3a084bc16', name: 'วิชาชีพครู' },
};

const rule = (c, n) => ({ categoryId: c.id, categoryName: c.name, questionCount: n });

const SETS = [
  {
    title: 'ข้อสอบจริง ภาค ก. ชุดที่ 1 (200 ข้อ)',
    description: 'จำลองข้อสอบครูผู้ช่วย ภาค ก. เต็มรูปแบบตามโครงสร้างจริง — คิดวิเคราะห์ 100 · ภาษาอังกฤษ 50 · ข้าราชการที่ดี 50 (300 นาที ผ่านเกณฑ์ 120 คะแนน)',
    categoryRules: [
      rule(CAT.general, 60), rule(CAT.thaiRead, 40),   // วิชา 1: คิดวิเคราะห์ = 100
      rule(CAT.english, 50),                            // วิชา 2: อังกฤษ = 50
      rule(CAT.civil, 15), rule(CAT.law, 15), rule(CAT.social, 10), rule(CAT.policy, 10), // วิชา 3 = 50
    ],
  },
  {
    title: 'ข้อสอบจริง ภาค ก. ชุดที่ 2 (200 ข้อ)',
    description: 'จำลองข้อสอบครูผู้ช่วย ภาค ก. เต็มรูปแบบ ชุดที่ 2 — สัดส่วนภายในต่างจากชุดที่ 1 เพื่อฝึกให้ครอบคลุมยิ่งขึ้น (300 นาที ผ่านเกณฑ์ 120 คะแนน)',
    categoryRules: [
      rule(CAT.general, 65), rule(CAT.thaiRead, 35),   // วิชา 1 = 100
      rule(CAT.english, 50),                            // วิชา 2 = 50
      rule(CAT.civil, 12), rule(CAT.law, 13), rule(CAT.social, 10), rule(CAT.teacher, 15), // วิชา 3 = 50
    ],
  },
];

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? 'APPLY' : 'DRY-RUN');

  // pick an admin as creator
  const adminSnap = await db.collection('users').where('role', '==', 'admin').limit(1).get();
  const createdBy = adminSnap.empty ? null : adminSnap.docs[0].id;

  // available active questions per category (make sure each rule is satisfiable)
  const avail = {};
  for (const c of Object.values(CAT)) {
    const s = await db.collection('questions').where('categoryId', '==', c.id).where('isActive', '==', true).get();
    avail[c.id] = s.size;
  }

  const existing = await db.collection('examSets').get();
  const existingTitles = new Set(); existing.forEach(d => existingTitles.add((d.data().title || '').trim()));

  let created = 0;
  for (const s of SETS) {
    const total = s.categoryRules.reduce((a, r) => a + r.questionCount, 0);
    console.log(`\n=== ${s.title} (รวม ${total} ข้อ) ===`);
    let ok = true;
    s.categoryRules.forEach(r => {
      const have = avail[r.categoryId] || 0;
      const good = have >= r.questionCount;
      if (!good) ok = false;
      console.log(`  ${good ? '✅' : '❌'} ${r.categoryName.slice(0, 34).padEnd(36)} ขอ ${String(r.questionCount).padStart(3)} / มี ${have}`);
    });
    if (total !== 200) { console.log('  ❌ รวมไม่เท่ากับ 200'); ok = false; }
    if (existingTitles.has(s.title)) { console.log('  ⏭️  มีชุดนี้อยู่แล้ว ข้าม'); continue; }
    if (!ok) { console.log('  ❌ ข้ามชุดนี้ (ข้อสอบไม่พอ)'); continue; }

    if (apply) {
      await db.collection('examSets').doc().set({
        title: s.title,
        description: s.description,
        mode: 'exam',
        totalQuestions: total,
        timeLimitMinutes: 300,
        passingScorePercent: 60,
        isActive: true,
        categoryRules: s.categoryRules,
        randomizeQuestions: true,
        // false: คลังข้อสอบสมดุล 25% ต่อตัวเลือกแล้ว และกันไม่ให้ข้อแบบ
        // "ความเพียงพอของข้อมูล/เปรียบเทียบเชิงปริมาณ" ที่ตัวเลือกมีความหมายตายตัวถูกสลับ
        randomizeChoices: false,
        showExplanationAfterSubmit: true,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
        legacyMongoId: null,
      });
      created++;
      console.log('  ✅ สร้างแล้ว');
    }
  }
  console.log(`\n${apply ? 'สร้างชุดใหม่ ' + created + ' ชุด' : '(ยังไม่เขียน — เพิ่ม --apply)'}`);
  process.exit(0);
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
