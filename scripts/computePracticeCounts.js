require('dotenv').config({ quiet: true });
const svc = require('../services/firestorePracticeCountService');

async function main() {
  console.log('กำลังคำนวณจำนวนข้อสอบต่อเรื่องย่อย...');
  const res = await svc.computeAndStoreCounts();
  console.log(`\n✅ คำนวณ ${res.topics} เรื่อง บันทึกลง appConfig/practiceTopicCounts แล้ว\n`);
  Object.entries(res.counts).forEach(([k, v]) => console.log(`  ${k}: ${v} ข้อ`));
  process.exit(0);
}

main().catch(err => { console.error('❌ ล้มเหลว:', err.message); process.exit(1); });
