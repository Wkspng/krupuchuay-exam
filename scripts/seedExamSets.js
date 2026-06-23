require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');
const Category = require('../models/Category');
const ExamSet = require('../models/ExamSet');
const Question = require('../models/Question');
const User = require('../models/User');

async function connectDb() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing in .env');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected: krupuchuay');
}

async function seedExamSet() {
  const admin = await User.findOne({ role: 'admin' }, '_id').sort({ createdAt: 1 });
  if (!admin) throw new Error('An approved admin account is required before seeding exam sets');

  const categories = await Category.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).limit(5);
  if (categories.length < 5) throw new Error('At least 5 active categories are required to seed the 50-question exam set');

  // The base seed currently provides five simulated questions per category. Add only
  // the missing simulated questions so the requested 50-question set is runnable;
  // no existing category, question, or attempt is removed.
  for (const [categoryIndex, category] of categories.entries()) {
    const existingCount = await Question.countDocuments({ categoryId: category._id, isActive: true });
    const missingCount = Math.max(0, 10 - existingCount);
    for (let offset = 0; offset < missingCount; offset += 1) {
      const number = existingCount + offset + 1;
      const seedKey = `exam-set-supplement-${category._id}-${number}`;
      await Question.findOneAndUpdate(
        { seedKey },
        {
          $set: {
            categoryId: category._id,
            questionText: `ข้อสอบจำลองสำหรับชุดครูผู้ช่วย ภาค ก.: ${category.name} ข้อเสริม ${number} — แนวทางใดเหมาะสมที่สุดเมื่อจำเป็นต้องใช้ข้อมูลเพื่อวางแผนการเรียนรู้`,
            choices: [
              'ตรวจสอบแหล่งข้อมูลและใช้เหตุผลประกอบก่อนตัดสินใจ',
              'เลือกข้อมูลเพียงแหล่งเดียวโดยไม่ตรวจสอบ',
              'ตัดสินใจจากความเห็นส่วนบุคคลเท่านั้น',
              'งดทบทวนข้อมูลที่เกี่ยวข้องทั้งหมด',
            ],
            correctAnswerIndex: 0,
            explanation: 'เป็นข้อสอบจำลองสำหรับทดสอบระบบ โดยเน้นการตรวจสอบข้อมูลและใช้เหตุผลก่อนตัดสินใจ',
            difficulty: ['easy', 'medium', 'hard'][offset % 3],
            source: 'ข้อสอบจำลองสำหรับทดสอบระบบชุดข้อสอบ',
            isActive: true,
            seedKey,
          },
        },
        { upsert: true, runValidators: true, setDefaultsOnInsert: true },
      );
    }
  }

  const categoryRules = categories.map((category) => ({
    categoryId: category._id,
    categoryName: category.name,
    questionCount: 10,
  }));
  const counts = await Promise.all(categories.map((category) => Question.countDocuments({ categoryId: category._id, isActive: true })));
  const hasEnoughQuestions = counts.every((count) => count >= 10);
  const description = hasEnoughQuestions
    ? 'ชุดข้อสอบจำลองสำหรับฝึกทำข้อสอบครูผู้ช่วย ภาค ก. ใช้ข้อสอบตัวอย่างจำลองในคลังระบบ'
    : 'ชุดข้อสอบจำลอง 50 ข้อ — ปิดใช้งานชั่วคราวจนกว่าจะมีข้อสอบที่เปิดใช้งานอย่างน้อย 10 ข้อต่อหมวด';

  await ExamSet.findOneAndUpdate(
    { seedKey: 'teacher-assistant-part-a-50' },
    {
      $set: {
        title: 'ครูผู้ช่วย ภาค ก. จำลอง 50 ข้อ',
        description,
        mode: 'exam',
        totalQuestions: 50,
        timeLimitMinutes: 60,
        passingScorePercent: 60,
        isActive: hasEnoughQuestions,
        categoryRules,
        randomizeQuestions: true,
        randomizeChoices: true,
        showExplanationAfterSubmit: true,
        createdBy: admin._id,
        seedKey: 'teacher-assistant-part-a-50',
      },
    },
    { upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded exam set: ครูผู้ช่วย ภาค ก. จำลอง 50 ข้อ (${hasEnoughQuestions ? 'active' : 'inactive: not enough active sample questions'}).`);
}

async function main() {
  try {
    await connectDb();
    await seedExamSet();
  } catch (error) {
    console.error('Exam set seed error:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
