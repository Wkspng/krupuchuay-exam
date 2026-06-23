require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const Question = require('../models/Question');

const categories = [
  { key: 'general-ability', name: 'ความสามารถทั่วไป', description: 'ข้อสอบตัวอย่างจำลองเพื่อฝึกการคิดวิเคราะห์และการคำนวณ', order: 1 },
  { key: 'thai-language', name: 'ภาษาไทย', description: 'ข้อสอบตัวอย่างจำลองเพื่อฝึกการสื่อสารและการใช้ภาษา', order: 2 },
  { key: 'education-law', name: 'กฎหมายการศึกษา', description: 'ข้อสอบตัวอย่างจำลองเกี่ยวกับหลักการและสถานการณ์ทางการศึกษา', order: 3 },
  { key: 'teaching-profession', name: 'วิชาชีพครู', description: 'ข้อสอบตัวอย่างจำลองเกี่ยวกับจรรยาบรรณและการจัดการเรียนรู้', order: 4 },
  { key: 'current-events', name: 'เหตุการณ์ปัจจุบัน', description: 'ข้อสอบตัวอย่างจำลองเพื่อฝึกวิเคราะห์ข้อมูลร่วมสมัย', order: 5 },
];

function sampleQuestions(category) {
  const prefix = `ข้อสอบตัวอย่างจำลอง: ${category.name}`;
  return [
    {
      questionText: `${prefix} ข้อ 1 หากต้องเริ่มศึกษาหัวข้อใหม่อย่างเป็นระบบ ควรทำสิ่งใดก่อน`,
      choices: ['กำหนดเป้าหมายและรวบรวมข้อมูลพื้นฐาน', 'ท่องจำเฉพาะคำตอบ', 'ข้ามไปทำแบบทดสอบทันที', 'เลือกคำตอบจากการเดา'],
      correctAnswerIndex: 0,
      explanation: 'การกำหนดเป้าหมายและสำรวจข้อมูลพื้นฐานช่วยให้เรียนรู้อย่างเป็นระบบ',
      difficulty: 'easy',
    },
    {
      questionText: `${prefix} ข้อ 2 หากแบ่งเวลาอ่าน 4 ช่วงและทำเสร็จแล้ว 3 ช่วง จะเหลือสัดส่วนของงานเท่าใด`,
      choices: ['หนึ่งในสี่', 'หนึ่งในสาม', 'หนึ่งในสอง', 'สามในสี่'],
      correctAnswerIndex: 0,
      explanation: 'ทำเสร็จ 3 จาก 4 ช่วง จึงเหลือ 1 จาก 4 ช่วง',
      difficulty: 'easy',
    },
    {
      questionText: `${prefix} ข้อ 3 วิธีใดเหมาะสมที่สุดสำหรับตรวจสอบความเข้าใจหลังอ่านเนื้อหา`,
      choices: ['อธิบายเนื้อหาด้วยคำของตนเองและตรวจคำตอบ', 'อ่านหัวข้อเดิมซ้ำโดยไม่คิด', 'เลือกเฉพาะส่วนที่ง่ายที่สุด', 'หยุดเมื่อจำคำศัพท์ได้บางคำ'],
      correctAnswerIndex: 0,
      explanation: 'การอธิบายด้วยตนเองและตรวจคำตอบช่วยประเมินความเข้าใจได้ดีกว่า',
      difficulty: 'medium',
    },
    {
      questionText: `${prefix} ข้อ 4 เมื่อพบข้อมูลใหม่ที่ขัดกับความเข้าใจเดิม ควรปฏิบัติอย่างไร`,
      choices: ['ตรวจสอบแหล่งข้อมูลและเหตุผลก่อนสรุป', 'ปฏิเสธข้อมูลทันที', 'ส่งต่อโดยไม่ตรวจสอบ', 'เลือกเชื่อเฉพาะข้อมูลเดิม'],
      correctAnswerIndex: 0,
      explanation: 'การตรวจสอบแหล่งข้อมูลและเหตุผลเป็นขั้นตอนสำคัญของการคิดอย่างมีวิจารณญาณ',
      difficulty: 'medium',
    },
    {
      questionText: `${prefix} ข้อ 5 ข้อใดเป็นแนวทางที่ช่วยพัฒนาผลการทำข้อสอบจำลองได้ดีที่สุด`,
      choices: ['วิเคราะห์ข้อผิดพลาดและวางแผนทบทวน', 'เปลี่ยนคำตอบทุกข้อหลังส่ง', 'ทำเฉพาะข้อที่เคยถูก', 'หลีกเลี่ยงการดูคำอธิบาย'],
      correctAnswerIndex: 0,
      explanation: 'การวิเคราะห์ข้อผิดพลาดช่วยให้ระบุหัวข้อที่ต้องทบทวนและพัฒนาได้ตรงจุด',
      difficulty: 'hard',
    },
  ];
}

async function connectDb() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing in .env');
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected: krupuchuay');
}

async function seed() {
  let questionCount = 0;

  for (const categoryData of categories) {
    const category = await Category.findOneAndUpdate(
      { name: categoryData.name },
      { $set: { ...categoryData, isActive: true } },
      { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );

    const questions = sampleQuestions(categoryData);
    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      await Question.findOneAndUpdate(
        { seedKey: `initial-${categoryData.key}-${index + 1}` },
        {
          $set: {
            ...question,
            categoryId: category._id,
            source: 'ชุดข้อสอบตัวอย่างจำลองสำหรับการทดสอบระบบ',
            isActive: true,
            seedKey: `initial-${categoryData.key}-${index + 1}`,
          },
        },
        { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
      questionCount += 1;
    }
  }

  console.log(`Seed completed: ${categories.length} categories and ${questionCount} sample questions.`);
}

async function main() {
  try {
    await connectDb();
    await seed();
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
