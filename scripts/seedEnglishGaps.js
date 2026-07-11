require('dotenv').config({ quiet: true });
const { db } = require('../src/firebaseAdmin');

const CATEGORY_NAME = 'ภาษาอังกฤษพื้นฐาน';

const QUESTIONS = [
  // ================= Vocabulary (คำศัพท์) =================
  { src: 'Vocabulary — คำศัพท์', diff: 'easy', q: 'Choose the word closest in meaning to "happy".',
    opts: ['glad', 'sad', 'angry', 'tired'], ans: 0, explain: '"happy" (มีความสุข) มีความหมายใกล้เคียงกับ "glad" (ดีใจ)' },
  { src: 'Vocabulary — คำศัพท์ antonym', diff: 'easy', q: 'Choose the OPPOSITE of "big".',
    opts: ['small', 'huge', 'large', 'tall'], ans: 0, explain: 'คำตรงข้ามของ "big" (ใหญ่) คือ "small" (เล็ก) ส่วน huge/large แปลว่าใหญ่' },
  { src: 'Vocabulary — คำศัพท์', diff: 'easy', q: '"Difficult" is closest in meaning to ___.',
    opts: ['hard', 'easy', 'simple', 'clear'], ans: 0, explain: '"difficult" (ยาก) มีความหมายเหมือน "hard"' },
  { src: 'Vocabulary — คำศัพท์ meaning', diff: 'medium', q: 'What is the meaning of "purchase"?',
    opts: ['buy', 'sell', 'give', 'lose'], ans: 0, explain: '"purchase" แปลว่า "ซื้อ" (buy)' },
  { src: 'Vocabulary — คำศัพท์ antonym', diff: 'medium', q: 'Choose the OPPOSITE of "increase".',
    opts: ['decrease', 'grow', 'rise', 'expand'], ans: 0, explain: 'คำตรงข้ามของ "increase" (เพิ่มขึ้น) คือ "decrease" (ลดลง)' },
  { src: 'Vocabulary — คำศัพท์ synonym', diff: 'easy', q: 'Choose the SYNONYM of "beautiful".',
    opts: ['pretty', 'ugly', 'plain', 'dull'], ans: 0, explain: '"beautiful" (สวย) มีความหมายเหมือน "pretty"' },
  { src: 'Vocabulary — คำศัพท์', diff: 'medium', q: '"Rapid" means ___.',
    opts: ['fast', 'slow', 'late', 'weak'], ans: 0, explain: '"rapid" แปลว่า "เร็ว" (fast)' },
  { src: 'Vocabulary — คำศัพท์ antonym', diff: 'medium', q: 'Choose the OPPOSITE of "ancient".',
    opts: ['modern', 'old', 'historic', 'past'], ans: 0, explain: 'คำตรงข้ามของ "ancient" (โบราณ) คือ "modern" (สมัยใหม่)' },
  { src: 'Vocabulary — คำศัพท์ synonym', diff: 'medium', q: 'Choose the SYNONYM of "smart".',
    opts: ['clever', 'foolish', 'lazy', 'slow'], ans: 0, explain: '"smart" (ฉลาด) มีความหมายเหมือน "clever"' },
  { src: 'Vocabulary — คำศัพท์ meaning', diff: 'medium', q: 'What is the meaning of "enormous"?',
    opts: ['very large', 'very small', 'very fast', 'very slow'], ans: 0, explain: '"enormous" แปลว่า "ใหญ่โตมาก" (very large)' },
  { src: 'Vocabulary — คำศัพท์ antonym', diff: 'medium', q: 'Choose the OPPOSITE of "arrive".',
    opts: ['depart', 'reach', 'come', 'land'], ans: 0, explain: 'คำตรงข้ามของ "arrive" (มาถึง) คือ "depart" (ออกเดินทาง)' },
  { src: 'Vocabulary — คำศัพท์ synonym', diff: 'easy', q: 'Choose the SYNONYM of "begin".',
    opts: ['start', 'end', 'stop', 'finish'], ans: 0, explain: '"begin" (เริ่ม) มีความหมายเหมือน "start"' },
  { src: 'Vocabulary — คำศัพท์', diff: 'medium', q: '"Wealthy" means ___.',
    opts: ['rich', 'poor', 'weak', 'kind'], ans: 0, explain: '"wealthy" แปลว่า "ร่ำรวย" (rich)' },
  { src: 'Vocabulary — คำศัพท์ antonym', diff: 'medium', q: 'Choose the OPPOSITE of "accept".',
    opts: ['reject', 'agree', 'receive', 'take'], ans: 0, explain: 'คำตรงข้ามของ "accept" (ยอมรับ) คือ "reject" (ปฏิเสธ)' },
  { src: 'Vocabulary — คำศัพท์ synonym', diff: 'medium', q: 'Choose the SYNONYM of "brave".',
    opts: ['courageous', 'fearful', 'weak', 'shy'], ans: 0, explain: '"brave" (กล้าหาญ) มีความหมายเหมือน "courageous"' },

  // ================= Conversation & Expression =================
  { src: 'Conversation & Expression', diff: 'easy', q: 'A: "Thank you very much."\nB: "___"',
    opts: ["You're welcome.", 'Thank you too.', 'I am fine.', 'Good night.'], ans: 0, explain: 'เมื่อมีคนขอบคุณ ตอบสุภาพว่า "You\'re welcome." (ยินดี/ไม่เป็นไร)' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'A: "How are you?"\nB: "___"',
    opts: ["I'm fine, thank you.", 'It is on the table.', 'Yes, I do.', 'At nine o\'clock.'], ans: 0, explain: 'คำถาม "How are you?" ตอบว่า "I\'m fine, thank you."' },
  { src: 'Conversation & Expression', diff: 'medium', q: 'A: "Would you like some tea?"\nB (politely refuses): "___"',
    opts: ['No, thank you.', 'Yes, I am.', "I don't know.", 'Never mind.'], ans: 0, explain: 'การปฏิเสธอย่างสุภาพใช้ "No, thank you."' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'A: "Nice to meet you."\nB: "___"',
    opts: ['Nice to meet you too.', 'You are welcome.', 'I am sorry.', 'Good luck.'], ans: 0, explain: 'ตอบการทักทายแรกพบว่า "Nice to meet you too."' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'When you make a mistake, what do you say to apologize?',
    opts: ["I'm sorry.", 'Thank you.', 'Congratulations!', 'Good morning.'], ans: 0, explain: 'การขอโทษใช้ "I\'m sorry."' },
  { src: 'Conversation & Expression', diff: 'medium', q: 'A: "Can I help you?"\nB (in a shop): "___"',
    opts: ["Yes, I'm looking for a shirt.", 'No, you cannot help.', 'I am a teacher.', 'It is raining.'], ans: 0, explain: 'เมื่อพนักงานถามว่าให้ช่วยไหม ตอบบอกความต้องการ เช่น "Yes, I\'m looking for a shirt."' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'How do you ask about the time?',
    opts: ['What time is it?', 'How much is it?', 'Where are you?', 'Who is he?'], ans: 0, explain: 'การถามเวลาใช้ "What time is it?"' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'A: "Happy birthday!"\nB: "___"',
    opts: ['Thank you!', 'Sorry!', 'Goodbye!', 'No, thanks.'], ans: 0, explain: 'เมื่อมีคนอวยพรวันเกิด ตอบว่า "Thank you!"' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'What do you say when you leave?',
    opts: ['Goodbye.', 'Hello.', 'Good morning.', 'Welcome.'], ans: 0, explain: 'เมื่อจากลาใช้ "Goodbye."' },
  { src: 'Conversation & Expression communication', diff: 'medium', q: 'The question "How much is this?" asks about the ___.',
    opts: ['price', 'time', 'name', 'place'], ans: 0, explain: '"How much is this?" เป็นการถามราคา (price)' },
  { src: 'Conversation & Expression', diff: 'medium', q: 'Complete the suggestion: "___ we go to the cinema?"',
    opts: ['Shall', 'Do', 'Is', 'Are'], ans: 0, explain: 'การเสนอชักชวนใช้ "Shall we ...?"' },
  { src: 'Conversation & Expression', diff: 'medium', q: 'A: "Excuse me, where is the station?"\nA is asking for ___.',
    opts: ['directions', 'food', 'time', 'money'], ans: 0, explain: 'การถามว่าสถานที่อยู่ที่ไหนคือการถามทาง (directions)' },
  { src: 'Conversation & Expression', diff: 'medium', q: 'Which is a polite way to ask someone to repeat?',
    opts: ['Could you say that again, please?', 'What do you want?', 'Go away.', 'I am busy.'], ans: 0, explain: 'ขอให้พูดซ้ำอย่างสุภาพใช้ "Could you say that again, please?"' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'A: "See you tomorrow!"\nB: "___"',
    opts: ['See you!', 'Sorry!', 'No, thanks.', 'Welcome.'], ans: 0, explain: 'ตอบการนัดพบว่า "See you!"' },
  { src: 'Conversation & Expression', diff: 'easy', q: 'What do you say to congratulate someone?',
    opts: ['Congratulations!', 'Sorry.', 'Goodbye.', 'Please.'], ans: 0, explain: 'การแสดงความยินดีใช้ "Congratulations!"' },

  // ================= Reading Comprehension =================
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "Tom goes to school by bus every morning. He leaves home at 7 a.m."\nHow does Tom go to school?',
    opts: ['By bus.', 'By car.', 'On foot.', 'By train.'], ans: 0, explain: 'ข้อความระบุ "by bus" ทอมไปโรงเรียนโดยรถบัส' },
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "Mary likes fruit. She eats an apple every day."\nWhat does Mary eat every day?',
    opts: ['An apple.', 'A banana.', 'Bread.', 'Rice.'], ans: 0, explain: 'ข้อความระบุว่าเธอกินแอปเปิลทุกวัน (an apple)' },
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "The library opens at 9 a.m. and closes at 6 p.m."\nWhat time does the library close?',
    opts: ['6 p.m.', '9 a.m.', '9 p.m.', '6 a.m.'], ans: 0, explain: 'ข้อความระบุว่าห้องสมุดปิดเวลา 6 p.m.' },
  { src: 'Reading Comprehension', diff: 'medium', q: 'Read: "It was raining, so the children stayed inside and played games."\nWhy did the children stay inside?',
    opts: ['Because it was raining.', 'Because it was hot.', 'Because they were hungry.', 'Because it was night.'], ans: 0, explain: 'ข้อความระบุเหตุผล "It was raining" (เพราะฝนตก)' },
  { src: 'Reading Comprehension', diff: 'medium', q: 'Read: "Ben has two dogs and one cat."\nHow many pets does Ben have?',
    opts: ['Three.', 'Two.', 'One.', 'Four.'], ans: 0, explain: 'สุนัข 2 + แมว 1 = สัตว์เลี้ยง 3 ตัว' },
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "Anna studies hard because she wants to be a doctor."\nWhat does Anna want to be?',
    opts: ['A doctor.', 'A teacher.', 'A nurse.', 'A pilot.'], ans: 0, explain: 'ข้อความระบุว่าเธออยากเป็นหมอ (a doctor)' },
  { src: 'Reading Comprehension', diff: 'medium', q: 'Read: "The shop sells books, pens, and notebooks."\nWhich item does the shop NOT sell?',
    opts: ['Shoes.', 'Books.', 'Pens.', 'Notebooks.'], ans: 0, explain: 'ร้านขายหนังสือ ปากกา สมุด แต่ไม่ได้ขายรองเท้า (shoes)' },
  { src: 'Reading Comprehension', diff: 'medium', q: 'Read: "John woke up late and missed the bus."\nWhat happened to John?',
    opts: ['He missed the bus.', 'He caught the bus.', 'He drove a car.', 'He walked to work.'], ans: 0, explain: 'ข้อความระบุว่าเขาตกรถบัส (missed the bus)' },
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "The weather today is hot and sunny."\nWhat is the weather like?',
    opts: ['Hot and sunny.', 'Cold and rainy.', 'Cool and windy.', 'Snowy.'], ans: 0, explain: 'ข้อความระบุว่าอากาศร้อนและแดดจัด (hot and sunny)' },
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "Grandma made a cake for my birthday. It was delicious."\nWho made the cake?',
    opts: ['Grandma.', 'Mother.', 'Sister.', 'Father.'], ans: 0, explain: 'ข้อความระบุว่าคุณยาย/ย่า (Grandma) เป็นคนทำเค้ก' },
  { src: 'Reading Comprehension', diff: 'medium', q: 'Read: "The museum is closed on Mondays."\nWhen is the museum closed?',
    opts: ['On Mondays.', 'On Sundays.', 'On weekends.', 'Every day.'], ans: 0, explain: 'ข้อความระบุว่าพิพิธภัณฑ์ปิดวันจันทร์ (on Mondays)' },
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "Sarah plays the piano beautifully."\nWhat does Sarah play?',
    opts: ['The piano.', 'The guitar.', 'The drums.', 'The violin.'], ans: 0, explain: 'ข้อความระบุว่าซาราห์เล่นเปียโน (the piano)' },
  { src: 'Reading Comprehension', diff: 'medium', q: 'Read: "We planted trees to make our school green."\nWhy did they plant trees?',
    opts: ['To make the school green.', 'To sell the wood.', 'To build a house.', 'To make furniture.'], ans: 0, explain: 'ข้อความระบุจุดประสงค์ "to make our school green"' },
  { src: 'Reading Comprehension', diff: 'easy', q: 'Read: "The train to Chiang Mai leaves at 8 p.m."\nWhere is the train going?',
    opts: ['Chiang Mai.', 'Bangkok.', 'Phuket.', 'Khon Kaen.'], ans: 0, explain: 'ข้อความระบุปลายทางคือเชียงใหม่ (Chiang Mai)' },
  { src: 'Reading Comprehension', diff: 'medium', q: 'Read: "Peter is taller than his brother."\nWho is taller?',
    opts: ['Peter.', 'His brother.', 'They are the same.', 'We cannot tell.'], ans: 0, explain: 'ข้อความระบุว่า Peter สูงกว่าน้องชาย (taller than his brother)' },

  // ================= Cloze Test (เพิ่มเติม) =================
  { src: 'Cloze Test', diff: 'easy', q: 'Complete: "The sun ___ in the east."',
    opts: ['rises', 'rise', 'rose', 'rising'], ans: 0, explain: 'ความจริงทั่วไปใช้ Present Simple ประธานเอกพจน์ (The sun) เติม s: "rises"' },
  { src: 'Cloze Test', diff: 'easy', q: 'Complete: "She ___ to music every evening."',
    opts: ['listens', 'listen', 'listening', 'listened'], ans: 0, explain: 'every evening บอกความเคยชิน ใช้ Present Simple ประธาน She เติม s: "listens"' },
  { src: 'Cloze Test', diff: 'medium', q: 'Complete: "There is ___ water in the glass."',
    opts: ['some', 'many', 'a few', 'an'], ans: 0, explain: 'water เป็นนามนับไม่ได้ ใช้ "some" (many/a few ใช้กับนามนับได้)' },
  { src: 'Cloze Test', diff: 'medium', q: 'Complete: "He is good ___ playing football."',
    opts: ['at', 'in', 'on', 'of'], ans: 0, explain: 'สำนวน "good at" (เก่งในเรื่อง...) ตามด้วย V-ing' },
  { src: 'Cloze Test', diff: 'medium', q: 'Complete: "I have two ___."',
    opts: ['children', 'childs', 'child', 'childrens'], ans: 0, explain: 'พหูพจน์ของ "child" คือ "children" (รูปพิเศษ)' },
  { src: 'Cloze Test', diff: 'medium', q: 'Complete: "This book is ___ than that one."',
    opts: ['cheaper', 'cheap', 'cheapest', 'more cheap'], ans: 0, explain: 'มี "than" แสดงการเปรียบเทียบขั้นกว่า คำสั้นเติม -er: "cheaper"' },
  { src: 'Cloze Test', diff: 'hard', q: 'Complete: "They ___ dinner when I arrived."',
    opts: ['were having', 'are having', 'has', 'have'], ans: 0, explain: 'เหตุการณ์กำลังดำเนินอยู่ในอดีตขณะมีอีกเหตุการณ์แทรก ใช้ Past Continuous: "were having"' },
  { src: 'Cloze Test', diff: 'hard', q: 'Complete: "___ she is tired, she keeps working."',
    opts: ['Although', 'Because', 'So', 'And'], ans: 0, explain: '"Although" (แม้ว่า) ใช้เชื่อมข้อความที่ขัดแย้งกัน (เหนื่อยแต่ยังทำงาน)' },
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
  console.log(`โหมด: ${dryRun ? 'DRY-RUN' : 'APPLY'} | เตรียม ${QUESTIONS.length} ข้อ`);
  QUESTIONS.forEach((q, i) => {
    if (!q.q || !q.q.trim()) throw new Error(`ข้อ ${i}: ไม่มีโจทย์`);
    if (!Array.isArray(q.opts) || q.opts.length !== 4) throw new Error(`ข้อ ${i}: ต้องมี 4 ตัวเลือก`);
    if (q.opts.some(o => !String(o).trim())) throw new Error(`ข้อ ${i}: ตัวเลือกว่าง`);
    if (!Number.isInteger(q.ans) || q.ans < 0 || q.ans > 3) throw new Error(`ข้อ ${i}: ans ต้อง 0-3`);
  });
  const categoryId = await findCategoryId();
  console.log(`✅ ${CATEGORY_NAME} (${categoryId})`);
  const existingSnap = await db.collection('questions').where('categoryId', '==', categoryId).get();
  const existing = new Set();
  existingSnap.forEach(d => existing.add(String(d.data().questionText || '').trim().toLowerCase()));

  let imported = 0, skipped = 0, batch = db.batch(), ops = 0;
  for (const q of QUESTIONS) {
    const text = q.q.trim();
    if (existing.has(text.toLowerCase())) { skipped++; continue; }
    if (!dryRun) {
      const ref = db.collection('questions').doc();
      batch.set(ref, {
        categoryId, categoryName: CATEGORY_NAME, questionText: text,
        choices: q.opts.map(o => String(o).trim()), correctAnswerIndex: q.ans,
        explanation: String(q.explain || '').trim(), difficulty: q.diff || 'medium',
        source: `ทักษะภาษาอังกฤษ — ${q.src}`, topic: q.src,
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
