const fs = require('fs');
const path = require('path');
const { db } = require('../src/firebaseAdmin');

const CATEGORY_ID = '6a394374c2e97ab3a084bc0f';
const CATEGORY_NAME = 'รัฐธรรมนูญและกฎหมายการศึกษา';
const CATEGORY_DESC = 'ข้อสอบวิชารัฐธรรมนูญและกฎหมายที่เกี่ยวข้องกับการจัดการศึกษา สำหรับการสอบครูผู้ช่วย ภาค ก.';

function loadQuestions() {
  const filePath = path.join(__dirname, '../data/const_law.js');
  if (!fs.existsSync(filePath)) {
    throw new Error(`ไม่พบไฟล์ข้อมูลข้อสอบที่: ${filePath}\nกรุณาสร้างไฟล์นี้และวางโค้ดข้อสอบก่อนรันสคริปต์`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  // Extract content between the first [ and the last ]
  const startIdx = content.indexOf('[');
  const endIdx = content.lastIndexOf(']');
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error('โครงสร้างไฟล์ไม่เป็นรูปแบบอาเรย์ [...] ที่ถูกต้อง');
  }
  
  const body = content.substring(startIdx + 1, endIdx);
  // eslint-disable-next-line no-new-func
  return new Function(`return [${body}]`)();
}

async function main() {
  console.log('=== เริ่มต้นการอิมพอร์ตข้อสอบรัฐธรรมนูญและกฎหมายการศึกษา ===');
  
  let newQuestions;
  try {
    newQuestions = loadQuestions();
    console.log(`📖 อ่านข้อสอบใหม่จากไฟล์ได้ทั้งหมด: ${newQuestions.length} ข้อ`);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการโหลดข้อสอบ:', error.message);
    process.exit(1);
  }

  // 1. Update Category Details
  console.log(`🔄 กำลังอัปเดตชื่อหมวดวิชาเป็น: "${CATEGORY_NAME}"...`);
  await db.collection('categories').doc(CATEGORY_ID).update({
    name: CATEGORY_NAME,
    description: CATEGORY_DESC,
    updatedAt: new Date()
  });
  console.log('✅ อัปเดตหมวดวิชาเรียบร้อยแล้ว');

  // 2. Delete Existing Questions in this Category
  console.log('🗑️ กำลังลบข้อสอบเดิมในหมวดวิชานี้...');
  const oldQuestionsSnap = await db.collection('questions')
    .where('categoryId', '==', CATEGORY_ID)
    .get();
    
  if (oldQuestionsSnap.size > 0) {
    const deleteBatch = db.batch();
    oldQuestionsSnap.forEach(doc => {
      deleteBatch.delete(doc.ref);
    });
    await deleteBatch.commit();
    console.log(`✅ ลบข้อสอบเดิมสำเร็จ: ${oldQuestionsSnap.size} ข้อ`);
  } else {
    console.log('ℹ️ ไม่มีข้อสอบเดิมที่จะต้องลบ');
  }

  // 3. Insert New Questions
  console.log('📤 กำลังนำเข้าข้อสอบชุดใหม่...');
  const BATCH_SIZE = 400;
  let batch = db.batch();
  let batchOps = 0;
  let imported = 0;

  for (const q of newQuestions) {
    const questionText = String(q.q || '').trim();
    if (!questionText) continue;

    const docRef = db.collection('questions').doc();
    batch.set(docRef, {
      categoryId: CATEGORY_ID,
      categoryName: CATEGORY_NAME,
      questionText,
      choices: (q.opts || []).map(o => String(o).trim()),
      correctAnswerIndex: q.ans,
      explanation: String(q.explain || '').trim(),
      difficulty: q.level === 'ยาก' ? 'hard' : (q.level === 'ปานกลาง' ? 'medium' : 'easy'),
      source: [q.topic, q.year ? `ปี ${q.year}` : ''].filter(Boolean).join(' — '),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    batchOps++;
    imported++;

    if (batchOps >= BATCH_SIZE) {
      await batch.commit();
      console.log(`📦 นำเข้าสำเร็จชั่วคราว: ${imported} ข้อ...`);
      batch = db.batch();
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 อิมพอร์ตเสร็จสมบูรณ์! นำเข้าข้อสอบชุดใหม่ทั้งหมด: ${imported} ข้อ`);
}

main().catch(err => {
  console.error('❌ เกิดข้อผิดพลาดในระบบ:', err);
  process.exit(1);
});
