const { db } = require('../src/firebaseAdmin');

const PRACTICE_EXAM_STRUCTURE = [
  {
    id: 'analytical_ability',
    title: 'ความสามารถในการคิดวิเคราะห์',
    score: 100,
    icon: '🧠',
    categoryNames: ['ความสามารถทั่วไป', 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)', 'ภาษาไทย'],
    subSubjects: [
      {
        id: 'language_analysis',
        title: 'คิดวิเคราะห์เชิงภาษา',
        categoryNames: ['ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)', 'ภาษาไทย'],
        topics: [
          { id: 'reading_main_idea', title: 'อ่านจับใจความ', keywords: ['จับใจความ', 'อ่านจับใจความ'] },
          { id: 'summary', title: 'สรุปความ', keywords: ['สรุปความ'] },
          { id: 'interpretation', title: 'ตีความ', keywords: ['ตีความ'] },
          { id: 'thai_communication', title: 'การใช้ภาษาไทยเพื่อการสื่อสาร', keywords: ['การใช้ภาษา', 'สื่อสาร', 'ภาษาไทย'] }
        ]
      },
      {
        id: 'abstract_reasoning',
        title: 'คิดวิเคราะห์เชิงนามธรรม',
        categoryNames: ['ความสามารถทั่วไป'],
        topics: [
          { id: 'word_relation', title: 'ความสัมพันธ์คำ/ข้อความ', keywords: ['อุปมาอุปไมย', 'ความสัมพันธ์'] },
          { id: 'symbol_relation', title: 'รูปภาพ/สัญลักษณ์', keywords: ['มิติสัมพันธ์', 'สัญลักษณ์', 'รูปภาพ'] },
          { id: 'logic_reasoning', title: 'เหตุผลเชิงตรรกะ', keywords: ['ตรรกศาสตร์', 'ตรรกะ', 'เหตุผล'] },
          { id: 'model_reasoning', title: 'แบบจำลอง/สถานการณ์', keywords: ['เงื่อนไขสัญลักษณ์', 'เงื่อนไขภาษา'] }
        ]
      },
      {
        id: 'quantitative_reasoning',
        title: 'คิดวิเคราะห์เชิงปริมาณ',
        categoryNames: ['ความสามารถทั่วไป'],
        topics: [
          { id: 'basic_math', title: 'คณิตศาสตร์พื้นฐาน', keywords: ['คณิตศาสตร์', 'สมการ', 'ร้อยละ', 'ดอกเบี้ย', 'ค.ร.น.', 'ห.ร.ม.'] },
          { id: 'series', title: 'อนุกรม', keywords: ['อนุกรม'] },
          { id: 'table_graph_stat', title: 'ตาราง/กราฟ/สถิติ', keywords: ['ตาราง', 'กราฟ', 'สถิติ'] },
          { id: 'quant_compare', title: 'เปรียบเทียบเชิงปริมาณ', keywords: ['เปรียบเทียบ'] },
          { id: 'data_sufficiency', title: 'ความเพียงพอของข้อมูล', keywords: ['ความเพียงพอ'] }
        ]
      }
    ]
  },
  {
    id: 'english_skill',
    title: 'ทักษะภาษาอังกฤษ',
    score: 50,
    icon: '🔡',
    categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
    subSubjects: [
      {
        id: 'english_vocab',
        title: 'Vocabulary',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          { id: 'vocab_meaning', title: 'Vocabulary & Meaning', keywords: ['vocab', 'word', 'meaning', 'synonym'] }
        ]
      },
      {
        id: 'english_grammar',
        title: 'Grammar & Structure',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          { id: 'grammar_structure', title: 'Grammar & Structure', keywords: ['grammar', 'tense', 'preposition', 'conjunction'] }
        ]
      },
      {
        id: 'english_conversation',
        title: 'Conversation / Communication',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          { id: 'conversation', title: 'Conversation & Expression', keywords: ['conversation', 'dialogue', 'expression', 'speaking'] }
        ]
      },
      {
        id: 'english_reading',
        title: 'Reading Comprehension',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          { id: 'reading', title: 'Reading Comprehension', keywords: ['reading', 'passage', 'comprehension'] }
        ]
      },
      {
        id: 'english_cloze',
        title: 'Cloze Test / Context',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          { id: 'cloze_test', title: 'Cloze Test & Fill-in', keywords: ['cloze', 'context'] }
        ]
      }
    ]
  },
  {
    id: 'good_civil_servant',
    title: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
    score: 50,
    icon: '🎖️',
    categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'รัฐธรรมนูญและกฎหมายการศึกษา', 'สังคม เศรษฐกิจ การเมือง บ้านเมือง', 'นโยบายรัฐ / ปฏิรูปการศึกษา', 'วิชาชีพครู'],
    subSubjects: [
      {
        id: 'admin_rules',
        title: 'ระเบียบบริหารราชการแผ่นดิน',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'รัฐธรรมนูญและกฎหมายการศึกษา'],
        topics: [
          { id: 'admin_law', title: 'ระเบียบบริหารราชการแผ่นดิน', keywords: ['ระเบียบบริหารราชการแผ่นดิน', 'บริหารแผ่นดิน'] }
        ]
      },
      {
        id: 'good_governance',
        title: 'หลักธรรมาภิบาล',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี'],
        topics: [
          { id: 'good_gov', title: 'หลักธรรมาภิบาล / บริหารกิจการบ้านเมืองที่ดี', keywords: ['ธรรมาภิบาล', 'กิจการบ้านเมืองที่ดี'] }
        ]
      },
      {
        id: 'ethics_standard',
        title: 'จริยธรรมและมาตรฐานทางจริยธรรม',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'วิชาชีพครู'],
        topics: [
          { id: 'ethics', title: 'มาตรฐานทางจริยธรรม / ประมวลจริยธรรม', keywords: ['จริยธรรม', 'ประมวลจริยธรรม', 'จรรยาบรรณ'] }
        ]
      },
      {
        id: 'civil_discipline',
        title: 'วินัยข้าราชการ',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'วิชาชีพครู'],
        topics: [
          { id: 'discipline', title: 'วินัยและการรักษาวินัย', keywords: ['วินัย', 'รักษาวินัย'] }
        ]
      },
      {
        id: 'good_servant',
        title: 'การเป็นข้าราชการที่ดี',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี'],
        topics: [
          { id: 'good_civil', title: 'หน้าที่และการเป็นข้าราชการที่ดี', keywords: ['ข้าราชการที่ดี', 'ลักษณะข้าราชการ'] }
        ]
      },
      {
        id: 'education_law',
        title: 'กฎหมายและระเบียบที่เกี่ยวกับการศึกษา',
        categoryNames: ['รัฐธรรมนูญและกฎหมายการศึกษา', 'วิชาชีพครู'],
        topics: [
          { id: 'edu_law_detail', title: 'กฎหมายการศึกษา / พ.ร.บ.การศึกษา', keywords: ['พ.ร.บ.', 'พระราชบัญญัติ', 'กฎหมายการศึกษา', 'รัฐธรรมนูญ'] }
        ]
      },
      {
        id: 'reform_policy',
        title: 'นโยบายรัฐและการปฏิรูปการศึกษา',
        categoryNames: ['นโยบายรัฐ / ปฏิรูปการศึกษา', 'สังคม เศรษฐกิจ การเมือง บ้านเมือง'],
        topics: [
          { id: 'policy_detail', title: 'นโยบายรัฐ / ปฏิรูปการศึกษา / ยุทธศาสตร์ชาติ', keywords: ['นโยบาย', 'ปฏิรูปการศึกษา', 'ยุทธศาสตร์ชาติ', 'เศรษฐกิจพอเพียง'] }
        ]
      }
    ]
  }
];

function suggestMapping(catName, topic = '', questionText = '') {
  const cn = catName || '';
  const tp = (topic || '').toLowerCase();
  const qt = (questionText || '').toLowerCase();

  // 1. Analytical Ability
  if (['ความสามารถทั่วไป', 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)', 'ภาษาไทย'].includes(cn)) {
    const mainSubject = 'analytical_ability';

    // 1.1 Language analysis
    if (cn.includes('ภาษาไทย') || tp.includes('ภาษาไทย') || tp.includes('จับใจความ') || tp.includes('สรุปความ') || tp.includes('ตีความ') || tp.includes('การใช้ภาษา')) {
      let topicId = 'thai_communication';
      if (tp.includes('จับใจความ') || qt.includes('จับใจความ')) topicId = 'reading_main_idea';
      else if (tp.includes('สรุปความ') || qt.includes('สรุปความ')) topicId = 'summary';
      else if (tp.includes('ตีความ') || qt.includes('ตีความ')) topicId = 'interpretation';

      return {
        examMainSubject: mainSubject,
        examSubSubject: 'language_analysis',
        examTopic: topicId,
        confidence: 'high',
        reason: `Mapped based on Thai language category "${cn}" and topic/keywords.`
      };
    }

    // 1.2 Quantitative Reasoning
    if (tp.includes('คณิตศาสตร์') || tp.includes('อนุกรม') || tp.includes('ตาราง') || tp.includes('กราฟ') || tp.includes('สถิติ') || tp.includes('เปรียบเทียบ') || tp.includes('เพียงพอ') ||
        qt.includes('อนุกรม') || qt.includes('สมการ') || qt.includes('ร้อยละ') || qt.includes('ค่าเฉลี่ย')) {
      let topicId = 'basic_math';
      if (tp.includes('อนุกรม') || qt.includes('อนุกรม')) topicId = 'series';
      else if (tp.includes('ตาราง') || tp.includes('กราฟ') || tp.includes('สถิติ') || qt.includes('ตาราง') || qt.includes('กราฟ')) topicId = 'table_graph_stat';
      else if (tp.includes('เปรียบเทียบ') || qt.includes('เปรียบเทียบ')) topicId = 'quant_compare';
      else if (tp.includes('เพียงพอ') || qt.includes('เพียงพอ')) topicId = 'data_sufficiency';

      return {
        examMainSubject: mainSubject,
        examSubSubject: 'quantitative_reasoning',
        examTopic: topicId,
        confidence: 'high',
        reason: `Mapped based on Quantitative Reasoning category "${cn}" and math keywords.`
      };
    }

    // 1.3 Abstract Reasoning (Default for "ความสามารถทั่วไป" if not matched as math/quant)
    let topicId = 'logic_reasoning';
    if (tp.includes('อุปมาอุปไมย') || tp.includes('ความสัมพันธ์') || qt.includes('อุปมาอุปไมย')) topicId = 'word_relation';
    else if (tp.includes('สัญลักษณ์') || tp.includes('รูปภาพ') || tp.includes('มิติสัมพันธ์')) topicId = 'symbol_relation';
    else if (tp.includes('เงื่อนไข')) topicId = 'model_reasoning';

    return {
      examMainSubject: mainSubject,
      examSubSubject: 'abstract_reasoning',
      examTopic: topicId,
      confidence: 'medium',
      reason: `Suggested Abstract Reasoning for general ability category "${cn}" with topic "${topic}".`
    };
  }

  // 2. English Skill
  if (['ภาษาอังกฤษพื้นฐาน'].includes(cn)) {
    const mainSubject = 'english_skill';
    let subSubject = 'english_grammar';
    let topicId = 'grammar_structure';
    let confidence = 'medium';

    if (tp.includes('vocab') || tp.includes('word') || tp.includes('meaning') || tp.includes('synonym') || qt.includes('synonym') || qt.includes('meaning of')) {
      subSubject = 'english_vocab';
      topicId = 'vocab_meaning';
      confidence = 'high';
    } else if (tp.includes('conversation') || tp.includes('dialogue') || tp.includes('speaking') || tp.includes('expression')) {
      subSubject = 'english_conversation';
      topicId = 'conversation';
      confidence = 'high';
    } else if (tp.includes('reading') || tp.includes('passage') || tp.includes('comprehension')) {
      subSubject = 'english_reading';
      topicId = 'reading';
      confidence = 'high';
    } else if (tp.includes('cloze') || tp.includes('context')) {
      subSubject = 'english_cloze';
      topicId = 'cloze_test';
      confidence = 'high';
    }

    return {
      examMainSubject: mainSubject,
      examSubSubject: subSubject,
      examTopic: topicId,
      confidence,
      reason: `Mapped based on English category "${cn}" and topic/keywords.`
    };
  }

  // 3. Good Civil Servant
  if (['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'รัฐธรรมนูญและกฎหมายการศึกษา', 'สังคม เศรษฐกิจ การเมือง บ้านเมือง', 'นโยบายรัฐ / ปฏิรูปการศึกษา', 'วิชาชีพครู'].includes(cn)) {
    const mainSubject = 'good_civil_servant';

    // 3.6 กฎหมายการศึกษา
    if (cn.includes('กฎหมายการศึกษา') || tp.includes('กฎหมาย') || tp.includes('พ.ร.บ.') || tp.includes('รัฐธรรมนูญ') || qt.includes('รัฐธรรมนูญ') || qt.includes('พ.ร.บ.')) {
      // 3.1 ระเบียบบริหารราชการแผ่นดิน
      if (tp.includes('บริหารราชการแผ่นดิน') || tp.includes('แผ่นดิน') || qt.includes('บริหารราชการแผ่นดิน')) {
        return {
          examMainSubject: mainSubject,
          examSubSubject: 'admin_rules',
          examTopic: 'admin_law',
          confidence: 'high',
          reason: `Mapped to administration rules based on topic "${topic}".`
        };
      }
      return {
        examMainSubject: mainSubject,
        examSubSubject: 'education_law',
        examTopic: 'edu_law_detail',
        confidence: 'high',
        reason: `Mapped to education laws/regulations based on category/topic.`
      };
    }

    // 3.7 นโยบายรัฐ
    if (cn.includes('นโยบาย') || cn.includes('สังคม') || tp.includes('นโยบาย') || tp.includes('ปฏิรูป') || tp.includes('เศรษฐกิจ') || tp.includes('ยุทธศาสตร์') || qt.includes('นโยบาย')) {
      return {
        examMainSubject: mainSubject,
        examSubSubject: 'reform_policy',
        examTopic: 'policy_detail',
        confidence: 'high',
        reason: `Mapped to reform policy and national strategy based on category/topic.`
      };
    }

    // Default Good Civil Servant sub-subjects
    let subSubject = 'good_servant';
    let topicId = 'good_civil';
    let confidence = 'medium';

    if (tp.includes('วินัย') || tp.includes('ละเมิด') || qt.includes('วินัย')) {
      subSubject = 'civil_discipline';
      topicId = 'discipline';
      confidence = 'high';
    } else if (tp.includes('จริยธรรม') || tp.includes('คุณธรรม') || tp.includes('จรรยาบรรณ') || qt.includes('จริยธรรม') || qt.includes('จรรยาบรรณ')) {
      subSubject = 'ethics_standard';
      topicId = 'ethics';
      confidence = 'high';
    } else if (tp.includes('ธรรมาภิบาล') || tp.includes('กิจการบ้านเมือง') || qt.includes('ธรรมาภิบาล') || qt.includes('บริหารกิจการบ้านเมือง')) {
      subSubject = 'good_governance';
      topicId = 'good_gov';
      confidence = 'high';
    }

    return {
      examMainSubject: mainSubject,
      examSubSubject: subSubject,
      examTopic: topicId,
      confidence,
      reason: `Suggested Good Civil Servant mapping for category "${cn}" and topic "${topic}".`
    };
  }

  // Fallback
  return {
    examMainSubject: 'analytical_ability',
    examSubSubject: 'abstract_reasoning',
    examTopic: 'logic_reasoning',
    confidence: 'low',
    reason: `Fallback mapping for category "${cn}" (unknown category).`
  };
}

async function runAudit() {
  console.log('=== STARTING QUESTION EXAM HIERARCHY AUDIT ===');
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  if (isDryRun) {
    console.log('Mode: DRY-RUN (No writes to database)');
  } else {
    console.log('Mode: AUDIT (Dry-run mode enforced in script requirements)');
  }

  try {
    // Fetch categories to resolve category names
    const categorySnapshot = await db.collection('categories').get();
    const categoriesMap = {};
    categorySnapshot.forEach(doc => {
      categoriesMap[doc.id] = doc.data().name || '';
    });
    console.log(`Resolved ${Object.keys(categoriesMap).length} categories.`);

    // Fetch all questions
    console.log('Fetching questions...');
    const questionSnapshot = await db.collection('questions').get();
    const questions = [];
    questionSnapshot.forEach(doc => {
      const data = doc.data();
      questions.push({
        id: doc.id,
        categoryId: data.categoryId,
        categoryName: categoriesMap[data.categoryId] || 'Unknown',
        topic: data.topic || '',
        q: data.q || '',
        source: data.source || ''
      });
    });

    console.log(`Loaded ${questions.length} questions.`);

    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    const auditedList = [];

    questions.forEach(q => {
      const mapping = suggestMapping(q.categoryName, q.topic, q.q);
      if (mapping.confidence === 'high') highCount++;
      else if (mapping.confidence === 'medium') mediumCount++;
      else lowCount++;

      auditedList.push({
        questionId: q.id,
        categoryName: q.categoryName,
        topic: q.topic,
        source: q.source,
        suggested: {
          examMainSubject: mapping.examMainSubject,
          examSubSubject: mapping.examSubSubject,
          examTopic: mapping.examTopic
        },
        confidence: mapping.confidence,
        reason: mapping.reason
      });
    });

    console.log('\n=== AUDIT SUMMARY ===');
    console.log(`Total questions audited: ${questions.length}`);
    console.log(`- High Confidence:   ${highCount} (${Math.round(highCount / questions.length * 100)}%)`);
    console.log(`- Medium Confidence: ${mediumCount} (${Math.round(mediumCount / questions.length * 100)}%)`);
    console.log(`- Low Confidence:    ${lowCount} (${Math.round(lowCount / questions.length * 100)}%)`);

    console.log('\n=== SAMPLE OF AUDITED QUESTIONS (FIRST 15) ===');
    auditedList.slice(0, 15).forEach((item, index) => {
      console.log(`${index + 1}. Question ID: ${item.questionId}`);
      console.log(`   - Category Name: ${item.categoryName}`);
      console.log(`   - Topic:         ${item.topic}`);
      console.log(`   - Suggested:     ${item.suggested.examMainSubject} ➔ ${item.suggested.examSubSubject} ➔ ${item.suggested.examTopic}`);
      console.log(`   - Confidence:    [${item.confidence.toUpperCase()}]`);
      console.log(`   - Reason:        ${item.reason}`);
      console.log('----------------------------------------------------');
    });

    console.log('\n=== AUDIT RUN COMPLETED ===');
    console.log('Firestore remained unchanged (No update operations were performed).');
  } catch (error) {
    console.error('Audit failed with error:', error);
  }
}

runAudit();
