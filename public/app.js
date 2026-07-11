'use strict';

// ===== DATA STRUCTURE =====
const PARTS = [
  {id:'p1',name:'ฝึกกลุ่มที่ 1 : ความรอบรู้และกฎหมาย',short:'ความรอบรู้และกฎหมาย',score:'(ฝึกแยกตามหมวด)',icon:'📖',tc:'#4fc3f7',bg:'rgba(79,195,247,.12)'},
  {id:'p2',name:'ฝึกกลุ่มที่ 2 : ความสามารถทั่วไปและภาษา',short:'ความสามารถทั่วไปและภาษา',score:'(ฝึกแยกตามหมวด)',icon:'🧮',tc:'#f0c040',bg:'rgba(240,192,64,.12)'},
  {id:'p3',name:'ฝึกกลุ่มที่ 3 : วิชาชีพครูและจริยธรรม',short:'วิชาชีพครูและจริยธรรม',score:'(ฝึกแยกตามหมวด)',icon:'🎓',tc:'#9b59b6',bg:'rgba(155,89,182,.12)'},
];

const PRACTICE_EXAM_STRUCTURE = [
  {
    id: 'analytical_ability',
    title: 'ความสามารถในการคิดวิเคราะห์',
    score: 100,
    icon: '🧠',
    description: 'เน้นการคิดวิเคราะห์เชิงภาษา เชิงนามธรรม และเชิงปริมาณ',
    categoryNames: ['ความสามารถทั่วไป', 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)', 'ภาษาไทย'],
    subSubjects: [
      {
        id: 'language_analysis',
        title: 'คิดวิเคราะห์เชิงภาษา',
        categoryNames: ['ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)', 'ภาษาไทย'],
        topics: [
          { id: 'reading_main_idea', title: 'อ่านจับใจความ', keywords: ['จับใจความ', 'อ่านจับใจความ', 'การอ่าน'] },
          { id: 'summary', title: 'สรุปความ', keywords: ['สรุปความ'] },
          { id: 'interpretation', title: 'ตีความ', keywords: ['ตีความ'] },
          { id: 'thai_communication', title: 'การใช้ภาษาไทยเพื่อการสื่อสาร', keywords: ['การใช้ภาษา', 'สื่อสาร', 'ภาษาไทย'] },
          { id: 'thai_grammar', title: 'ชนิดและหน้าที่ของคำ', keywords: ['ชนิดของคำ', 'หน้าที่ของคำ', 'การสร้างคำ', 'คำซ้อน', 'คำประสม'] },
          { id: 'thai_sentence_type', title: 'ประเภทประโยค', keywords: ['ประเภทประโยค', 'ความเดียว', 'ความรวม', 'ความซ้อน'] },
          { id: 'thai_proverb', title: 'สำนวน สุภาษิต คำพังเพย', keywords: ['สำนวนไทย', 'สำนวน', 'สุภาษิต', 'คำพังเพย'] },
          { id: 'royal_vocab', title: 'ราชาศัพท์และระดับภาษา', keywords: ['ราชาศัพท์', 'ระดับภาษา'] },
          { id: 'thai_rhetoric', title: 'โวหารภาพพจน์', keywords: ['โวหาร', 'อุปมาโวหาร', 'อุปลักษณ์', 'บุคลาธิษฐาน', 'อติพจน์'] },
          { id: 'thai_phonetics', title: 'เสียงและอักษรไทย', keywords: ['ไตรยางศ์', 'วรรณยุกต์'] },
          { id: 'thai_literature', title: 'วรรณคดีและฉันทลักษณ์', keywords: ['วรรณคดีไทย', 'ฉันทลักษณ์', 'ประเภทวรรณกรรม'] },
          { id: 'thai_writing', title: 'การเขียนและเครื่องหมาย', keywords: ['การเขียน', 'เครื่องหมายวรรคตอน'] }
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
          { id: 'basic_math', title: 'คณิตศาสตร์พื้นฐาน', keywords: ['คณิตศาสตร์', 'สมการ', 'ร้อยละ', 'ดอกเบี้ย', 'ค.ร.น.', 'ห.ร.ม.', 'พีชคณิต', 'เรขาคณิต'] },
          { id: 'series', title: 'อนุกรม', keywords: ['อนุกรม', 'ลำดับ'] },
          { id: 'table_graph_stat', title: 'ตาราง/กราฟ/สถิติ', keywords: ['ตาราง', 'กราฟ', 'สถิติ', 'ค่าเฉลี่ย', 'มัธยฐาน', 'ฐานนิยม'] },
          { id: 'quant_compare', title: 'เปรียบเทียบเชิงปริมาณ', keywords: ['เปรียบเทียบ'] },
          { id: 'data_sufficiency', title: 'ความเพียงพอของข้อมูล', keywords: ['ความเพียงพอ'] },
          { id: 'ratio_proportion', title: 'อัตราส่วนและสัดส่วน', keywords: ['อัตราส่วน', 'สัดส่วน'] },
          { id: 'set_theory', title: 'เซต', keywords: ['เซต'] },
          { id: 'probability', title: 'ความน่าจะเป็นและการนับ', keywords: ['ความน่าจะเป็น', 'จัดเรียง', 'สับเปลี่ยน', 'combination'] }
        ]
      }
    ]
  },
  {
    id: 'english_skill',
    title: 'ทักษะภาษาอังกฤษ',
    score: 50,
    icon: '🔡',
    description: 'ทักษะภาษาอังกฤษพื้นฐาน การสื่อสาร ไวยากรณ์ และการอ่าน',
    categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
    subSubjects: [
      {
        id: 'english_vocab',
        title: 'Vocabulary',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          {
            id: 'vocab_basic',
            title: 'คำศัพท์พื้นฐาน',
            keywords: ['vocabulary', 'คำศัพท์', 'meaning', 'synonym', 'antonym'],
            categoryNames: ['ภาษาอังกฤษพื้นฐาน']
          }
        ]
      },
      {
        id: 'english_grammar',
        title: 'Grammar & Structure',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          {
            id: 'grammar_structure',
            title: 'Grammar & Structure',
            keywords: ['grammar', 'tense', 'preposition', 'conjunction', 'structure', 'sentence'],
            categoryNames: ['ภาษาอังกฤษพื้นฐาน']
          }
        ]
      },
      {
        id: 'english_conversation',
        title: 'Conversation / Communication',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          {
            id: 'conversation',
            title: 'Conversation & Expression',
            keywords: ['conversation', 'dialogue', 'expression', 'speaking', 'communication'],
            categoryNames: ['ภาษาอังกฤษพื้นฐาน']
          }
        ]
      },
      {
        id: 'english_reading',
        title: 'Reading Comprehension',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          {
            id: 'reading',
            title: 'Reading Comprehension',
            keywords: ['reading', 'passage', 'comprehension', 'text'],
            categoryNames: ['ภาษาอังกฤษพื้นฐาน']
          }
        ]
      },
      {
        id: 'english_cloze',
        title: 'Cloze Test / Context',
        categoryNames: ['ภาษาอังกฤษพื้นฐาน'],
        topics: [
          {
            id: 'cloze_test',
            title: 'Cloze Test & Fill-in',
            keywords: ['cloze', 'context', 'fill'],
            categoryNames: ['ภาษาอังกฤษพื้นฐาน']
          }
        ]
      }
    ]
  },
  {
    id: 'good_civil_servant',
    title: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
    score: 50,
    icon: '🎖️',
    description: 'พระราชบัญญัติ ระเบียบวินัย คุณธรรมจริยธรรม และการเป็นข้าราชการที่ดี',
    categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'รัฐธรรมนูญและกฎหมายการศึกษา', 'สังคม เศรษฐกิจ การเมือง บ้านเมือง', 'นโยบายรัฐ / ปฏิรูปการศึกษา', 'วิชาชีพครู'],
    subSubjects: [
      {
        id: 'constitution',
        title: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย',
        categoryNames: ['รัฐธรรมนูญและกฎหมายการศึกษา'],
        topics: [
          {
            id: 'constitution_rights',
            title: 'สิทธิเสรีภาพและหน้าที่ของรัฐ',
            keywords: ['รัฐธรรมนูญ', 'มาตรา', 'สิทธิเสรีภาพ', 'หน้าที่ของรัฐ', 'อำนาจอธิปไตย', 'หมวด']
          }
        ]
      },
      {
        id: 'social_economics',
        title: 'สังคม เศรษฐกิจ การเมือง',
        categoryNames: ['สังคม เศรษฐกิจ การเมือง บ้านเมือง'],
        topics: [
          {
            id: 'asean_global',
            title: 'อาเซียนและประชาคมโลก',
            keywords: ['อาเซียน', 'ASEAN', 'ประชาคม', 'กฎบัตร', 'ประชาคมอาเซียน']
          },
          {
            id: 'democracy_politics',
            title: 'ประชาธิปไตยและการเมือง',
            keywords: ['ประชาธิปไตย', 'เลือกตั้ง', 'รัฐสภา', 'รัฐบาล', 'พรรคการเมือง', 'การเมือง']
          },
          {
            id: 'economics_development',
            title: 'เศรษฐกิจและการพัฒนา',
            keywords: ['เศรษฐกิจ', 'เศรษฐกิจพอเพียง', 'GDP', 'การพัฒนา', 'ความยากจน', 'สังคม']
          }
        ]
      },
      {
        id: 'civil_servant_law',
        title: 'กฎหมายข้าราชการพลเรือน',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี'],
        topics: [
          {
            id: 'civil_servant_statute',
            title: 'พ.ร.บ.ระเบียบข้าราชการพลเรือน',
            keywords: ['ข้าราชการพลเรือน', 'ก.พ.', 'สมรรถนะ', 'ประเมินผลงาน', 'เลื่อนเงินเดือน', 'บรรจุแต่งตั้ง']
          }
        ]
      },
      {
        id: 'admin_rules',
        title: 'ระเบียบบริหารราชการแผ่นดิน',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'รัฐธรรมนูญและกฎหมายการศึกษา'],
        topics: [
          {
            id: 'admin_law',
            title: 'ระเบียบบริหารราชการแผ่นดิน',
            keywords: [
              'ระเบียบบริหารราชการ',
              'บริหารราชการแดิน',
              'บริหารราชการแผ่นดิน',
              'บริหารแผ่นดิน',
              'ส่วนกลาง',
              'ส่วนภูมิภาค',
              'ส่วนท้องถิ่น',
              'กระทรวง',
              'กรม',
              'จังหวัด',
              'อำเภอ',
              'อบจ',
              'เทศบาล',
              'อบต',
              'ราชการส่วนกลาง',
              'ราชการส่วนภูมิภาค',
              'ราชการส่วนท้องถิ่น'
            ]
          }
        ]
      },
      {
        id: 'good_governance',
        title: 'หลักธรรมาภิบาล',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี'],
        topics: [
          {
            id: 'good_gov',
            title: 'หลักธรรมาภิบาล / บริหารกิจการบ้านเมืองที่ดี',
            keywords: [
              'ธรรมาภิบาล',
              'good governance',
              'หลักนิติธรรม',
              'คุณธรรม',
              'ความโปร่งใส',
              'การมีส่วนร่วม',
              'ความรับผิดชอบ',
              'ความคุ้มค่า'
            ]
          }
        ]
      },
      {
        id: 'ethics_standard',
        title: 'จริยธรรมและมาตรฐานทางจริยธรรม',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'วิชาชีพครู'],
        topics: [
          {
            id: 'ethics',
            title: 'มาตรฐานทางจริยธรรม / ประมวลจริยธรรม',
            keywords: [
              'จริยธรรม',
              'มาตรฐานทางจริยธรรม',
              'ประมวลจริยธรรม',
              'integrity',
              'ซื่อสัตย์สุจริต',
              'ผลประโยชน์ทับซ้อน',
              'โปร่งใส'
            ]
          }
        ]
      },
      {
        id: 'civil_discipline',
        title: 'วินัยข้าราชการ',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี', 'วิชาชีพครู'],
        topics: [
          {
            id: 'discipline',
            title: 'วินัยและการรักษาวินัย',
            keywords: [
              'วินัย',
              'วินัยข้าราชการ',
              'ผิดวินัย',
              'โทษทางวินัย',
              'ภาคทัณฑ์',
              'ตัดเงินเดือน',
              'ลดเงินเดือน',
              'ปลดออก',
              'ไล่ออก'
            ]
          }
        ]
      },
      {
        id: 'good_servant',
        title: 'การเป็นข้าราชการที่ดี',
        categoryNames: ['ความรู้และลักษณะการเป็นข้าราชการที่ดี'],
        topics: [
          {
            id: 'good_civil',
            title: 'หน้าที่และการเป็นข้าราชการที่ดี',
            keywords: [
              'ข้าราชการที่ดี',
              'คุณลักษณะข้าราชการ',
              'บริการประชาชน',
              'จิตสาธารณะ',
              'อุทิศตน',
              'ความรับผิดชอบ',
              'ประโยชน์ส่วนรวม'
            ]
          }
        ]
      },
      {
        id: 'education_law',
        title: 'กฎหมายและระเบียบที่เกี่ยวกับการศึกษา',
        categoryNames: ['รัฐธรรมนูญและกฎหมายการศึกษา', 'วิชาชีพครู'],
        topics: [
          {
            id: 'edu_law_detail',
            title: 'กฎหมายการศึกษา / พ.ร.บ.การศึกษา',
            keywords: [
              'พระราชบัญญัติการศึกษา',
              'พ.ร.บ.การศึกษา',
              'ก.ค.ศ.',
              'วิทยฐานะ',
              'ใบอนุญาตประกอบวิชาชีพ',
              'มาตรฐานวิชาชีพ',
              'คุรุสภา',
              'ข้าราชการครู',
              'วPA',
              'ประกันคุณภาพการศึกษา'
            ]
          }
        ]
      },
      {
        id: 'reform_policy',
        title: 'นโยบายรัฐและการปฏิรูปการศึกษา',
        categoryNames: ['นโยบายรัฐ / ปฏิรูปการศึกษา', 'สังคม เศรษฐกิจ การเมือง บ้านเมือง'],
        topics: [
          {
            id: 'policy_detail',
            title: 'นโยบายรัฐ / ปฏิรูปการศึกษา / ยุทธศาสตร์ชาติ',
            keywords: [
              'นโยบายรัฐ',
              'ปฏิรูปการศึกษา',
              'ยุทธศาสตร์ชาติ',
              'แผนการศึกษาแห่งชาติ',
              'Thailand 4.0',
              'SDGs',
              'เศรษฐกิจพอเพียง',
              'การศึกษาไทย'
            ]
          }
        ]
      }
    ]
  }
];

// Hardcoded QB arrays and SUBJECTS were removed in Phase 5G-2.
// Source of truth is now Firestore and Exam Packs.

// ===== STATE =====
const APP_VERSION = '1.2.17';
console.log(`App version: ${APP_VERSION}`);

let authReadyResolve;
const authReadyPromise = new Promise(resolve => {
  authReadyResolve = resolve;
});

async function waitForAuthReady() {
  await authReadyPromise;
}

const ENABLE_APP_CHECK = false;
let currentUser = null, currentSubject = null, currentQuestions = [], currentQ = 0, userAnswers = [], quizStartTime = null, timerInterval = null, answered = false, mongoQuizCategories = [], finishingQuiz = false;

async function jwtHeaders(options = {}) {
  await waitForAuthReady();
  const firebaseUser = (auth && auth.currentUser) || (window.firebase && firebase.auth().currentUser);
  if (!firebaseUser) {
    throw new Error('AUTH_REQUIRED');
  }
  const token = await firebaseUser.getIdToken(!!options.forceRefresh);
  return { Authorization: `Bearer ${token}` };
}

async function getAppCheckHeaders() {
  if (!ENABLE_APP_CHECK) return {};

  try {
    const appCheckInstance = window.firebase && firebase.appCheck ? firebase.appCheck() : null;
    if (appCheckInstance) {
      const tokenResult = await appCheckInstance.getToken(false);
      return tokenResult?.token ? { 'X-Firebase-AppCheck': tokenResult.token } : {};
    }
    return {};
  } catch (err) {
    console.warn('[APP_CHECK_DISABLED_OR_FAILED]', err?.code || err?.message || err);
    return {};
  }
}

async function apiFetch(url, options = {}, retry = true) {
  await waitForAuthReady();
  const needsAuth = options.auth !== false;
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {})
  };

  if (needsAuth) {
    try {
      const tokenHeaders = await jwtHeaders({ forceRefresh: false });
      Object.assign(headers, tokenHeaders);
    } catch (e) {
      if (e.message === 'AUTH_REQUIRED') {
        if (options.optionalAuth) {
          // continue without auth token
        } else {
          throw e;
        }
      } else {
        throw e;
      }
    }
  }

  // Attempt to attach Firebase App Check token
  try {
    const appCheckHeaders = await getAppCheckHeaders();
    Object.assign(headers, appCheckHeaders);
  } catch (err) {
    console.warn('[APP-CHECK-WARNING] Failed to obtain App Check token:', err);
  }

  const response = await fetch(url, { ...options, headers });

  if ((response.status === 401 || response.status === 403) && needsAuth && retry) {
    const firebaseUser = (auth && auth.currentUser) || (window.firebase && firebase.auth().currentUser);
    if (firebaseUser) {
      try {
        const refreshedHeaders = await jwtHeaders({ forceRefresh: true });
        const retryResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            ...refreshedHeaders
          }
        });
        
        if (retryResponse.status === 429) {
          try {
            const clone = retryResponse.clone();
            const errBody = await clone.json();
            alert(errBody.message || 'มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่');
          } catch (e) {
            alert('มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่');
          }
        }
        return retryResponse;
      } catch (retryError) {
        console.error('Retry auth error:', retryError);
      }
    }
  }

  if (response.status === 429) {
    try {
      const clone = response.clone();
      const errBody = await clone.json();
      alert(errBody.message || 'มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่');
    } catch (e) {
      alert('มีการใช้งานถี่เกินไป กรุณารอสักครู่แล้วลองใหม่');
    }
  }

  return response;
}

// ===== FIREBASE INITIALIZATION & STATE LISTENER =====
let auth;

async function initializeAppAuth() {
  try {
    const config = {
      apiKey: 'AIzaSyD1EJ5FHahxNhy40mAyGcUgl1red_7wOUs',
      authDomain: 'moonlight-krupuchuay-exam.firebaseapp.com',
      projectId: 'moonlight-krupuchuay-exam',
      storageBucket: 'moonlight-krupuchuay-exam.firebasestorage.app',
      messagingSenderId: '128921965845',
      appId: '1:128921965845:web:dfd42886b64570f655451c',
    };
    firebase.initializeApp(config);

    // Initialize Firebase App Check with reCAPTCHA v3 site key (non-secret)
    const RECAPTCHA_SITE_KEY = '6Lcc-bcqAAAAAO0P4V9pZf06zYk1U6D90T5oJ1Gv'; // TODO: Replace with your actual reCAPTCHA v3 site key in production
    if (ENABLE_APP_CHECK) {
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        try {
          const appCheck = firebase.appCheck();
          appCheck.activate(RECAPTCHA_SITE_KEY, true);
          console.log('Firebase App Check initialized.');
        } catch (err) {
          console.warn('App Check failed to initialize:', err);
        }
      } else {
        // Localhost debug provider
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
        try {
          const appCheck = firebase.appCheck();
          appCheck.activate(RECAPTCHA_SITE_KEY, true);
          console.log('Firebase App Check initialized in debug mode.');
        } catch (err) {
          console.warn('App Check failed to initialize in debug mode:', err);
        }
      }
    } else {
      console.log('Firebase App Check is disabled in monitor/disabled setup.');
    }
    auth = firebase.auth();
    
    let firstCheck = true;
    // Listen for authentication state changes:
    auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          localStorage.setItem('authToken', idToken);
          
          const sessionRes = await fetch('/api/session', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          if (sessionRes.ok) {
            const user = await sessionRes.json();
            localStorage.setItem('authUser', JSON.stringify(user));
            currentUser = user;
            
            // Resolve authReady first to prevent deadlock in buildHome/showPage
            if (firstCheck) {
              firstCheck = false;
              authReadyResolve();
            }
            
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appScreen').style.display = 'block';
            document.getElementById('userBadge').textContent = '👤 ' + user.name;
            document.getElementById('examSetsTab').style.display = '';
            document.getElementById('realExamTab').style.display = '';
            
            if (user.role === 'admin') {
              document.getElementById('adminTab').style.display = '';
              document.getElementById('questionBankTab').style.display = '';
              document.getElementById('examSetAdminTab').style.display = '';
              renderPendingUsers();
            }
            
            checkApprovalStatus();
            await buildHome();
            if (document.getElementById('page-home').classList.contains('active')) {
              showPage('home');
            }
          } else {
            currentUser = null;
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            if (firstCheck) {
              firstCheck = false;
              authReadyResolve();
            }
            await auth.signOut();
          }
        } catch (err) {
          console.error('Error during auth state change processing:', err);
          if (firstCheck) {
            firstCheck = false;
            authReadyResolve();
          }
        }
      } else {
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('appScreen').style.display = 'none';
        document.getElementById('examSetsTab').style.display = 'none';
        document.getElementById('realExamTab').style.display = 'none';
        document.getElementById('adminTab').style.display = 'none';
        document.getElementById('questionBankTab').style.display = 'none';
        document.getElementById('examSetAdminTab').style.display = 'none';
        
        const pendingNotice = document.getElementById('pendingNotice');
        if (pendingNotice) pendingNotice.style.display = 'none';

        if (firstCheck) {
          firstCheck = false;
          authReadyResolve();
        }
      }
    });
  } catch (err) {
    console.error('Error initializing Firebase:', err);
    authReadyResolve();
  }
}

function checkApprovalStatus() {
  const isApproved = currentUser && (currentUser.approvalStatus === 'approved' || currentUser.isApproved);
  const status = currentUser ? (currentUser.approvalStatus || 'pending') : 'pending';
  let pendingNotice = document.getElementById('pendingNotice');
  
  if (currentUser && !isApproved) {
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) navTabs.style.display = 'none';
    
    let title = 'บัญชีของคุณอยู่ระหว่างรอการอนุมัติ';
    let desc = 'กรุณารอผู้ดูแลระบบ (Admin) อนุมัติการเข้าใช้งานระบบทดสอบข้อสอบ';
    let icon = '⏳';
    
    if (status === 'rejected') {
      title = 'บัญชีของคุณไม่ได้รับการอนุมัติ';
      desc = 'ขออภัย บัญชีของคุณไม่ผ่านการอนุมัติเข้าใช้งานระบบ กรุณาติดต่อแอดมิน';
      icon = '❌';
    }
    
    if (!pendingNotice) {
      pendingNotice = document.createElement('div');
      pendingNotice.id = 'pendingNotice';
      pendingNotice.innerHTML = `
        <div class="pending-notice-box" style="max-width: 500px; margin: 80px auto; padding: 40px; background: var(--card); border: 1px solid var(--border); border-radius: 24px; text-align: center; box-shadow: 0 16px 48px rgba(0,0,0,0.4);">
          <span style="font-size: 64px; display: block; margin-bottom: 20px;">${icon}</span>
          <h2 style="margin-bottom: 12px; font-family: 'Prompt', sans-serif; color: var(--gold);">${title}</h2>
          <p style="color: var(--text); margin-bottom: 16px; font-size: 15px;">${desc}</p>
          <p style="color: var(--muted); font-size: 13px; margin-bottom: 24px;">อีเมลบัญชี: ${currentUser.email || currentUser.username}</p>
          <div style="display: flex; justify-content: center; gap: 10px;">
            <button class="btn btn-primary" onclick="refreshUserStatus()">🔄 ตรวจสอบสถานะ</button>
            <button class="btn btn-secondary" onclick="doLogout()">ออกจากระบบ</button>
          </div>
        </div>
      `;
      document.getElementById('appScreen').appendChild(pendingNotice);
    } else {
      pendingNotice.querySelector('span').textContent = icon;
      pendingNotice.querySelector('h2').textContent = title;
      pendingNotice.querySelector('p').textContent = desc;
      pendingNotice.querySelector('.pending-notice-box p:nth-child(4)').textContent = 'อีเมลบัญชี: ' + (currentUser.email || currentUser.username);
      pendingNotice.style.display = 'block';
    }
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  } else {
    const navTabs = document.querySelector('.nav-tabs');
    if (navTabs) navTabs.style.display = 'flex';
    if (pendingNotice) pendingNotice.style.display = 'none';
  }
}

async function refreshUserStatus() {
  if (auth && auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken(true);
      localStorage.setItem('authToken', idToken);
      
      const sessionRes = await fetch('/api/session', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      if (sessionRes.ok) {
        const user = await sessionRes.json();
        localStorage.setItem('authUser', JSON.stringify(user));
        currentUser = user;
        checkApprovalStatus();
        if (currentUser.approvalStatus === 'approved' || currentUser.isApproved) {
          await buildHome();
          showPage('home');
        } else {
          alert('⏳ บัญชีของคุณยังไม่ได้รับการอนุมัติ กรุณารอแอดมินดำเนินการ');
        }
      }
    } catch (e) {
      console.error(e);
      alert('เกิดข้อผิดพลาดในการตรวจสอบสถานะ กรุณาลองใหม่');
    }
  }
}

function isValidEmailFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

// ===== AUTH =====
async function doLogin() {
  const email = document.getElementById('inputUser').value.trim();
  const password = document.getElementById('inputPass').value;
  const errMsg = document.getElementById('errMsg');
  errMsg.style.display = 'none';
  
  if (!email) {
    errMsg.textContent = '❌ กรุณากรอกอีเมล';
    errMsg.style.display = 'block';
    return;
  }
  if (!isValidEmailFormat(email)) {
    errMsg.textContent = '❌ กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com';
    errMsg.style.display = 'block';
    return;
  }
  if (!password) {
    errMsg.textContent = '❌ กรุณากรอกรหัสผ่าน';
    errMsg.style.display = 'block';
    return;
  }
  
  if (!auth) {
    errMsg.textContent = '❌ ระบบ Authentication ยังไม่พร้อมใช้งาน';
    errMsg.style.display = 'block';
    return;
  }
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const idToken = await userCredential.user.getIdToken();
    
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      errMsg.textContent = data.error || '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      errMsg.style.display = 'block';
      await auth.signOut();
      return;
    }
    
    const { user } = await res.json();
    
    console.log('[LOGIN_DEBUG]', {
      email: user.email,
      authUid: user.uid,
      profileExists: true,
      role: user.role,
      approvalStatus: user.approvalStatus
    });

    if (user.approvalStatus === 'pending') {
      errMsg.textContent = '❌ บัญชียังไม่ได้รับการอนุมัติ';
      errMsg.style.display = 'block';
      await auth.signOut();
      return;
    }
    if (user.approvalStatus === 'rejected') {
      errMsg.textContent = '❌ บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน';
      errMsg.style.display = 'block';
      await auth.signOut();
      return;
    }
    if (!['admin', 'user'].includes(user.role)) {
      errMsg.textContent = '❌ บัญชีนี้ไม่มีสิทธิ์เข้าใช้งาน';
      errMsg.style.display = 'block';
      await auth.signOut();
      return;
    }

    localStorage.setItem('authToken', idToken);
    localStorage.setItem('authUser', JSON.stringify(user));
    currentUser = user;
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    document.getElementById('userBadge').textContent = '👤 ' + user.name;
    document.getElementById('examSetsTab').style.display = '';
    document.getElementById('realExamTab').style.display = '';
    
    if (user.role === 'admin') {
      document.getElementById('adminTab').style.display = '';
      document.getElementById('questionBankTab').style.display = '';
      document.getElementById('examSetAdminTab').style.display = '';
      renderPendingUsers();
    }
    
    checkApprovalStatus();
    await buildHome();
    showPage('home');
  } catch (e) {
    console.error('[LOGIN_ERROR]', e);
    let msg = '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือระบบขัดข้อง';
    if (e.code === 'auth/invalid-email') {
      msg = '❌ กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com';
    } else if (e.code === 'auth/user-not-found') {
      msg = '❌ ไม่พบบัญชีนี้';
    } else if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
      msg = '❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง';
    } else if (e.code === 'auth/too-many-requests') {
      msg = '❌ ลองใหม่ภายหลัง';
    } else if (e.message) {
      msg = `❌ ${e.message}`;
    }
    errMsg.textContent = msg;
    errMsg.style.display = 'block';
  }
}

function showRegisterScreen() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('registerScreen').style.display = 'flex';
  document.getElementById('regErrMsg').style.display = 'none';
  document.getElementById('regSuccessMsg').style.display = 'none';
}

function backToLogin() {
  document.getElementById('registerScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('regUser').value = '';
  document.getElementById('regPass').value = '';
  document.getElementById('regPassConfirm').value = '';
  document.getElementById('regName').value = '';
}

async function doRegister() {
  const email = document.getElementById('regUser').value.trim();
  const password = document.getElementById('regPass').value;
  const confirmPassword = document.getElementById('regPassConfirm').value;
  const name = document.getElementById('regName').value.trim();
  const errMsg = document.getElementById('regErrMsg');
  const successMsg = document.getElementById('regSuccessMsg');
  errMsg.style.display = 'none';
  successMsg.style.display = 'none';
  
  if (!name) {
    errMsg.textContent = 'กรุณากรอกชื่อ-นามสกุล';
    errMsg.style.display = 'block';
    return;
  }
  if (!email) {
    errMsg.textContent = 'กรุณากรอกอีเมล';
    errMsg.style.display = 'block';
    return;
  }
  if (!isValidEmailFormat(email)) {
    errMsg.textContent = 'กรุณากรอกอีเมลให้ถูกต้อง เช่น example@gmail.com';
    errMsg.style.display = 'block';
    return;
  }
  if (!password || !confirmPassword) {
    errMsg.textContent = 'กรุณากรอกรหัสผ่านให้ครบถ้วน';
    errMsg.style.display = 'block';
    return;
  }
  if (password.length < 6) {
    errMsg.textContent = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    errMsg.style.display = 'block';
    return;
  }
  if (password !== confirmPassword) {
    errMsg.textContent = 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน';
    errMsg.style.display = 'block';
    return;
  }
  
  if (!auth) {
    errMsg.textContent = 'ระบบ Authentication ยังไม่พร้อมใช้งาน';
    errMsg.style.display = 'block';
    return;
  }
  
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    await userCredential.user.updateProfile({ displayName: name });
    const idToken = await userCredential.user.getIdToken();
    
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, idToken })
    });
    
    const data = await res.json();
    if (!res.ok) {
      errMsg.textContent = data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
      errMsg.style.display = 'block';
      try { await userCredential.user.delete(); } catch (delErr) {}
      return;
    }
    
    successMsg.textContent = 'สมัครสมาชิกสำเร็จ กรุณารอแอดมินอนุมัติบัญชีก่อนเข้าใช้งาน';
    successMsg.style.display = 'block';
    await auth.signOut();
    setTimeout(backToLogin, 2000);
  } catch (e) {
    console.error(e);
    errMsg.textContent = e.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก';
    errMsg.style.display = 'block';
  }
}

async function doLogout() {
  currentUser = null;
  clearInterval(timerInterval);
  localStorage.removeItem('authToken');
  localStorage.removeItem('authUser');
  if (auth) {
    try { await auth.signOut(); } catch (e) {}
  }
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('examSetsTab').style.display = 'none';
  document.getElementById('realExamTab').style.display = 'none';
  document.getElementById('adminTab').style.display = 'none';
  document.getElementById('questionBankTab').style.display = 'none';
  document.getElementById('examSetAdminTab').style.display = 'none';
  document.getElementById('inputUser').value = '';
  document.getElementById('inputPass').value = '';
  document.getElementById('errMsg').style.display = 'none';
  const pendingNotice = document.getElementById('pendingNotice');
  if (pendingNotice) pendingNotice.style.display = 'none';
}

async function checkSession() {
  await initializeAppAuth();
}

// ===== NAV =====
async function showPage(id) {
  const loader = document.getElementById('authLoader');
  if (loader) loader.style.display = 'flex';

  try {
    await waitForAuthReady();
  } finally {
    if (loader) loader.style.display = 'none';
  }

  if (['admin', 'question-bank', 'exam-set-admin'].includes(id) && currentUser?.role !== 'admin') {
    alert('ไม่มีสิทธิ์เข้าถึง');
    showPage('home');
    return;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  const m = { home: 0, quiz: 1, stats: 2 };
  if (m[id] !== undefined) { const tabs = document.querySelectorAll('.nav-tab'); if (tabs[m[id]]) tabs[m[id]].classList.add('active'); }
  if (id === 'admin') document.getElementById('adminTab').classList.add('active');
  if (id === 'question-bank') document.getElementById('questionBankTab').classList.add('active');
  if (id === 'exam-sets') document.getElementById('examSetsTab').classList.add('active');
  if (id === 'exam-set-admin') document.getElementById('examSetAdminTab').classList.add('active');
  if (id === 'real-exam') document.getElementById('realExamTab').classList.add('active');
  
  if (id === 'home') await buildHome();
  if (id === 'stats') await renderStats();
  if (id === 'admin') await renderAdmin(true);
  if (id === 'question-bank') await renderQuestionBank();
  if (id === 'exam-sets') await renderExamSets();
  if (id === 'exam-set-admin') await renderExamSetAdmin();
  if (id === 'real-exam') await renderRealExamHome();
}

// ===== HOME =====
// Mappings from Firestore category name to respective Part (p1/p2/p3), display icon, and legacy keys for fallbacks.
const CATEGORY_UI_MAP = {
  'รัฐธรรมนูญและกฎหมายการศึกษา': { part: 'p1', icon: '⚖️', legacyKeys: ['const_law', 'edu_acts'] },
  'สังคม เศรษฐกิจ การเมือง บ้านเมือง': { part: 'p1', icon: '🌏', legacyKeys: ['social_econ'] },
  'นโยบายรัฐ / ปฏิรูปการศึกษา': { part: 'p1', icon: '🏛️', legacyKeys: ['policy'] },
  'ความรู้และลักษณะการเป็นข้าราชการที่ดี': { part: 'p1', icon: '🎖️', legacyKeys: ['civil_servant', 'kharachkan'] },
  'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)': { part: 'p2', icon: '🔤', legacyKeys: ['thai_lang'] },
  'ภาษาไทย': { part: 'p2', icon: '🔤', legacyKeys: [] },
  'ความสามารถทั่วไป': { part: 'p2', icon: '🧠', legacyKeys: ['math', 'reasoning'] },
  'ภาษาอังกฤษพื้นฐาน': { part: 'p2', icon: '🔡', legacyKeys: ['eng_basic'] },
  'วิชาชีพครู': { part: 'p3', icon: '📋', legacyKeys: ['ethics', 'prof_std'] }
};

async function fetchHistory() {
  try {
    const res = await apiFetch('/api/history/' + currentUser.username);
    if (res.ok) return await res.json();
  } catch (e) {}
  return [];
}

async function buildHome() {
  const hist = await fetchHistory();
  let html = '';
  let categories = [];
  let useFallback = false;

  try {
    const res = await apiFetch('/api/categories');
    if (res.ok) {
      categories = await res.json();
      mongoQuizCategories = categories;
      categories = categories.filter(c => c.isActive === true && (c.totalQuestions > 0));
      if (categories.length === 0) useFallback = true;
    } else {
      useFallback = true;
    }
  } catch (e) {
    useFallback = true;
  }

  if (useFallback) {
    console.error('❌ [API-ERROR] Failed to load Firestore categories.');
    html = `
      <div style="text-align:center;padding:40px;color:var(--text-secondary);background:var(--card-bg);border-radius:12px;border:1px solid var(--border);grid-column:1/-1;">
        <p style="margin-bottom:16px;">ไม่สามารถโหลดหมวดข้อสอบได้ กรุณารีเฟรชหน้าเว็บอีกครั้ง</p>
        <button class="btn btn-primary" onclick="buildHome()" style="padding:8px 24px;border:none;background:var(--accent);color:#fff;border-radius:6px;cursor:pointer;">ลองใหม่</button>
      </div>
    `;
    document.getElementById('subjectContainer').innerHTML = html;
    return;
  }

  html += `
    <div style="margin-top: 16px;">
      <p style="font-size: 13.5px; color: var(--muted); margin-bottom: 20px;">
        💡 คลิกที่หัวข้อหลักด้านล่างเพื่อเลือกดูหัวข้อย่อยและเรื่องย่อยที่ต้องการฝึกฝนแยกเป็นรายเรื่อง
      </p>
  `;

  PRACTICE_EXAM_STRUCTURE.forEach(mainSub => {
    // Count total questions in this main subject by summing associated categories
    let totalQuestions = 0;
    mainSub.categoryNames.forEach(catName => {
      const normName = String(catName).toLowerCase().trim();
      const cat = categories.find(c => {
        const cName = String(c.name || c.categoryName || '').toLowerCase().trim();
        return cName === normName;
      });
      if (cat) {
        totalQuestions += (cat.totalQuestions || 0);
      } else {
        console.warn('[PRACTICE_CATEGORY_NOT_FOUND]', {
          targetId: mainSub.id,
          title: mainSub.title,
          categoryNames: mainSub.categoryNames,
          availableCategories: categories.map(c => c.name)
        });
      }
    });

    html += `
      <div class="bank-section" style="margin-bottom: 20px; border-radius: 16px; padding: 22px; transition: all 0.2s;">
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 26px;">${mainSub.icon || '🧠'}</span>
            <div>
              <h3 style="font-family: 'Prompt', sans-serif; font-size: 18px; color: var(--gold); margin: 0;">
                ${mainSub.title} <span style="font-size: 13px; color: var(--accent); font-weight: normal;">(${mainSub.score} คะแนนเต็ม)</span>
              </h3>
              <p style="margin: 3px 0 0; font-size: 12.5px; color: var(--muted);">${mainSub.description}</p>
            </div>
          </div>
          <div style="font-size: 12.5px; color: var(--muted); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 8px;">
            คลังข้อสอบทั้งหมด: <strong>${totalQuestions} ข้อ</strong>
          </div>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px;">
          <button class="btn btn-primary btn-sm" onclick="startPracticeQuiz('mainSubject', '${mainSub.id}', 50)" style="display: flex; align-items: center; gap: 6px; font-weight: bold; background: linear-gradient(135deg, var(--gold), #d4a017); color: var(--navy2);">
            ⚡ ฝึกวิชาหลักนี้ (สุ่ม 50 ข้อ)
          </button>
          <button class="btn btn-secondary btn-sm" onclick="toggleSubSubjects('${mainSub.id}')" id="toggle-btn-${mainSub.id}" style="display: flex; align-items: center; gap: 6px; border-color: rgba(255,255,255,0.1);">
            📁 แสดงหัวข้อย่อยและเรื่องย่อย
          </button>
        </div>

        <!-- Sub Subjects Container -->
        <div id="sub-container-${mainSub.id}" style="display: none; background: rgba(0, 0, 0, 0.15); border-radius: 12px; padding: 14px 18px; border: 1px solid rgba(255,255,255,0.04); margin-top: 12px; animation: fadeUp .2s ease;">
          <div style="font-size: 12.5px; color: var(--muted); margin-bottom: 12px; font-style: italic;">
            ⚠️ หมวดวิชาย่อยและเรื่องย่อยด้านล่างนี้เป็นแบบฝึกแบบระบุเรื่องเพื่อทบทวนความรู้ ไม่ใช่โครงสร้างข้อสอบจริง
          </div>
    `;

    mainSub.subSubjects.forEach(sub => {
      html += `
        <div style="margin-bottom: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); padding-bottom: 14px;">
          <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
            <h4 style="font-family: 'Prompt', sans-serif; font-size: 14.5px; color: var(--text); margin: 0; font-weight: bold;">
              📁 ${sub.title}
            </h4>
            <button class="btn btn-secondary btn-sm" onclick="startPracticeQuiz('subSubject', '${sub.id}', 30)" style="font-size: 11px; padding: 4px 10px; border-radius: 6px;">
              ⚡ ฝึกวิชาย่อยนี้ (สุ่ม 30 ข้อ)
            </button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; padding-left: 14px;">
      `;

      sub.topics.forEach(top => {
        html += `
          <div onclick="startPracticeQuiz('topic', '${top.id}', 20)" class="option-btn" style="padding: 8px 12px; font-size: 13px; border-radius: 8px; margin: 0; background: var(--navy); border-color: rgba(255,255,255,0.05); cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: space-between;">
            <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 6px;">📝 ${top.title}</span>
            <span id="count-${mainSub.id}-${sub.id}-${top.id}" style="font-size: 10px; color: var(--accent); background: rgba(79,195,247,0.1); padding: 1px 6px; border-radius: 4px; flex-shrink: 0;">… ข้อ</span>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  });

  html += `</div>`;
  document.getElementById('subjectContainer').innerHTML = html;

  // Fill real per-topic question counts asynchronously (keeps home render fast)
  updatePracticeCounts();
}

// Read precomputed per-topic counts from a single tiny endpoint (1 Firestore
// read server-side) and write them into the topic badges. Counts are refreshed
// admin-side whenever the exam packs are recompiled, so this avoids downloading
// the whole question bank on every home load.
let _practiceCountCache = null; // { compositeTopicId -> count } cached for the session

async function updatePracticeCounts() {
  try {
    let counts = _practiceCountCache;
    if (!counts) {
      const res = await apiFetch('/api/practice/topic-counts', { auth: false });
      const data = res.ok ? await res.json() : { counts: {} };
      counts = data.counts || {};
      _practiceCountCache = counts;
    }

    PRACTICE_EXAM_STRUCTURE.forEach(m => {
      (m.subSubjects || []).forEach(s => {
        (s.topics || []).forEach(t => {
          const el = document.getElementById(`count-${m.id}-${s.id}-${t.id}`);
          if (!el) return;
          const n = counts[`${m.id}-${s.id}-${t.id}`];
          el.textContent = `${n === undefined ? 0 : n} ข้อ`;
        });
      });
    });
  } catch (err) {
    console.warn('[PRACTICE_COUNTS_FAILED]', err);
  }
}

function toggleSubSubjects(mainSubId) {
  const container = document.getElementById(`sub-container-${mainSubId}`);
  const btn = document.getElementById(`toggle-btn-${mainSubId}`);
  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.innerHTML = '📂 ซ่อนหัวข้อย่อยและเรื่องย่อย';
  } else {
    container.style.display = 'none';
    btn.innerHTML = '📁 แสดงหัวข้อย่อยและเรื่องย่อย';
  }
}

async function startPracticeQuiz(type, targetId, limit) {
  const loader = document.getElementById('authLoader');
  if (loader) loader.style.display = 'flex';

  try {
    let targetObj = null;
    let categoryNames = [];
    let keywords = [];
    let title = '';

    if (type === 'mainSubject') {
      targetObj = PRACTICE_EXAM_STRUCTURE.find(m => m.id === targetId);
      categoryNames = targetObj.categoryNames;
      title = `ฝึกวิชาหลัก: ${targetObj.title}`;
    } else if (type === 'subSubject') {
      for (const m of PRACTICE_EXAM_STRUCTURE) {
        const sub = m.subSubjects.find(s => s.id === targetId);
        if (sub) {
          targetObj = sub;
          categoryNames = sub.categoryNames;
          title = `ฝึกวิชาหลัก: ${m.title} ➔ ${sub.title}`;
          break;
        }
      }
    } else if (type === 'topic') {
      for (const m of PRACTICE_EXAM_STRUCTURE) {
        for (const sub of m.subSubjects) {
          const top = sub.topics.find(t => t.id === targetId);
          if (top) {
            targetObj = top;
            categoryNames = top.categoryNames || sub.categoryNames;
            keywords = top.keywords || [];
            title = `ฝึกเรื่อง: ${top.title}`;
            break;
          }
        }
        if (targetObj) break;
      }
    }

    if (!targetObj) {
      alert('ไม่พบข้อมูลโครงสร้างการฝึก');
      return;
    }

    // Resolve category IDs
    const categoryIds = categoryNames.map(name => {
      const normName = String(name).toLowerCase().trim();
      const cat = mongoQuizCategories.find(c => {
        const cName = String(c.name || c.categoryName || '').toLowerCase().trim();
        return cName === normName;
      });
      return cat ? (cat.id || cat._id) : null;
    }).filter(Boolean);

    if (categoryIds.length === 0) {
      console.warn('[PRACTICE_CATEGORY_NOT_FOUND]', {
        targetId,
        title,
        categoryNames,
        availableCategories: mongoQuizCategories.map(c => c.name)
      });
      alert('ไม่พบหมวดวิชาที่เกี่ยวข้องในระบบ');
      return;
    }

    // Fetch questions from all categories in parallel.
    // API caps each response at 100 questions (random subset of the pack).
    // For keyword-filtered practice (topic/subSubject) a category can hold far
    // more than 100 questions, so fetch several rounds and de-duplicate to cover
    // (almost) the full pool — otherwise topic-specific questions get missed.
    const needsFullPool = (type === 'topic' || type === 'subSubject');
    const FETCH_ROUNDS = needsFullPool ? 3 : 1;

    const fetchPromises = [];
    categoryIds.forEach(catId => {
      for (let r = 0; r < FETCH_ROUNDS; r++) {
        fetchPromises.push(
          apiFetch(`/api/questions/random?categoryId=${catId}&limit=100`, { auth: false })
            .then(res => res.ok ? res.json() : [])
            .then(data => Array.isArray(data) ? data : (data.questions || []))
            .catch(() => [])
        );
      }
    });

    const results = await Promise.all(fetchPromises);
    let allQuestions = [];
    results.forEach(qList => {
      allQuestions = allQuestions.concat(qList);
    });

    // Normalize
    allQuestions = allQuestions.map(normalizeQuestionForClient);

    // De-duplicate (multiple fetch rounds return overlapping random subsets)
    const seenQuestionIds = new Set();
    allQuestions = allQuestions.filter(q => {
      const qid = q.questionId || q.id;
      if (!qid) return true;
      if (seenQuestionIds.has(qid)) return false;
      seenQuestionIds.add(qid);
      return true;
    });

    let filtered = [];
    let matchedCount = 0;
    let topUpQuestions = [];

    const validAllQuestions = allQuestions.filter(q =>
      q.q &&
      Array.isArray(q.opts) &&
      q.opts.length >= 2 &&
      Number.isInteger(q.ans) &&
      q.ans >= 0
    );
    const rawPoolCount = validAllQuestions.length;

    const subSubjectKeywords = type === 'subSubject'
      ? (targetObj.topics || []).flatMap(t => t.keywords || []).filter(Boolean)
      : [];

    if (type === 'topic') {
      const matchedQuestions = validAllQuestions.filter(q => {
        const fields = [
          q.topic || '',
          q.categoryName || '',
          q.q || '',
          q.explain || '',
          q.source || ''
        ];
        const normalizedContent = fields
          .map(f => String(f).toLowerCase().trim().replace(/\s+/g, ' '))
          .join(' ');

        const normalizedTitle = targetObj.title.toLowerCase().trim().replace(/\s+/g, ' ');
        if (normalizedContent.includes(normalizedTitle)) return true;

        return keywords.some(kw => {
          const normalizedKw = kw.toLowerCase().trim().replace(/\s+/g, ' ');
          return normalizedContent.includes(normalizedKw);
        });
      });

      matchedCount = matchedQuestions.length;

      if (matchedCount > 0) {
        const shuffledMatched = [...matchedQuestions].sort(() => 0.5 - Math.random());
        if (matchedCount < limit && rawPoolCount > matchedCount) {
          const matchedIds = new Set(matchedQuestions.map(q => q.questionId || q.id));
          topUpQuestions = validAllQuestions
            .filter(q => !matchedIds.has(q.questionId || q.id))
            .sort(() => 0.5 - Math.random())
            .slice(0, limit - matchedCount);
          filtered = [...shuffledMatched, ...topUpQuestions];
        } else {
          filtered = shuffledMatched;
        }
      } else {
        console.warn('[PRACTICE_TOPIC_FALLBACK]', {
          topicId: targetId,
          topicTitle: targetObj.title,
          keywords,
          categoryIds
        });
        filtered = validAllQuestions;
      }
    } else if (type === 'subSubject' && subSubjectKeywords.length > 0) {
      const matchedQuestions = validAllQuestions.filter(q => {
        const fields = [
          q.topic || '',
          q.categoryName || '',
          q.q || '',
          q.explain || '',
          q.source || ''
        ];
        const normalizedContent = fields
          .map(f => String(f).toLowerCase().trim().replace(/\s+/g, ' '))
          .join(' ');

        return subSubjectKeywords.some(kw => {
          const normalizedKw = kw.toLowerCase().trim().replace(/\s+/g, ' ');
          return normalizedContent.includes(normalizedKw);
        });
      });

      matchedCount = matchedQuestions.length;

      if (matchedCount > 0) {
        const shuffledMatched = [...matchedQuestions].sort(() => 0.5 - Math.random());
        if (matchedCount < limit && rawPoolCount > matchedCount) {
          const matchedIds = new Set(matchedQuestions.map(q => q.questionId || q.id));
          topUpQuestions = validAllQuestions
            .filter(q => !matchedIds.has(q.questionId || q.id))
            .sort(() => 0.5 - Math.random())
            .slice(0, limit - matchedCount);
          filtered = [...shuffledMatched, ...topUpQuestions];
        } else {
          filtered = shuffledMatched;
        }
      } else {
        console.warn('[PRACTICE_SUBJECT_FALLBACK]', {
          targetId,
          title,
          keywords: subSubjectKeywords,
          categoryIds
        });
        filtered = validAllQuestions;
      }
    } else {
      filtered = validAllQuestions;
      matchedCount = rawPoolCount;
    }

    const pool = filtered;

    if (pool.length === 0) {
      alert('ไม่สามารถดึงข้อสอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // For keyword-filtered practice, keep matched-first order (matched questions
    // were already shuffled within their group and placed ahead of top-up ones).
    // For everything else, shuffle the whole pool.
    const keywordFiltered = (type === 'topic') || (type === 'subSubject' && subSubjectKeywords.length > 0);
    const selected = (keywordFiltered && matchedCount > 0)
      ? pool.slice(0, limit)
      : pool.sort(() => 0.5 - Math.random()).slice(0, limit);
    const selectedCount = selected.length;

    if (type === 'subSubject' && subSubjectKeywords.length > 0) {
      console.log('[PRACTICE_SUBJECT_MATCH]', {
        targetId,
        title,
        rawPoolCount,
        matchedCount,
        topUpCount: topUpQuestions.length,
        selectedCount
      });
    } else {
      console.log('[PRACTICE_TOPIC_MATCH]', {
        targetId,
        title,
        rawPoolCount,
        matchedCount,
        topUpCount: topUpQuestions.length,
        selectedCount
      });
    }

    currentQuestions = selected;
    currentQ = 0;
    userAnswers = new Array(selected.length).fill(-1);
    quizStartTime = Date.now();
    answered = false;
    finishingQuiz = false;

    // Build simulated currentSubject
    currentSubject = {
      id: targetId,
      categoryId: categoryIds[0], // pass first categoryId for API attempt save validator
      name: title,
      icon: type === 'mainSubject' ? (targetObj.icon || '🧠') : '🧠',
      partObj: {
        id: targetId,
        name: title,
        short: 'ฝึกฝน',
        bg: 'rgba(79,195,247,.12)',
        tc: 'var(--accent)'
      },
      isPracticeHierarchy: true,
      practiceType: type,
      practiceTargetId: targetId,
      practiceTitle: title,
      examSet: null
    };

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    showPage('quiz');
    renderQuestion();

  } catch (error) {
    console.error('Error starting practice quiz:', error);
    alert('เกิดข้อผิดพลาดในการโหลดข้อสอบ');
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

// ===== QUIZ =====
function normalizeQuestionForClient(q) {
  const questionText = q.questionText || q.q || q.text || '';
  const choices = q.choices || q.options || q.opts || [];
  const correctAnswerIndex =
    Number.isInteger(q.correctAnswerIndex) ? q.correctAnswerIndex :
    Number.isInteger(q.ans) ? q.ans :
    Number.isInteger(q.answerIndex) ? q.answerIndex :
    -1;

  return {
    id: q.id || q._id || q.questionId || '',
    questionId: q.questionId || q.id || q._id || '',
    q: questionText,
    opts: choices,
    ans: correctAnswerIndex,
    explain: q.explanation || q.explain || '',
    topic: q.topic || '',
    source: q.source || '',
    categoryName: q.categoryName || '',
    difficulty: q.difficulty || 'medium'
  };
}

async function startQuiz(subjectId) {
  let pt = null;
  let categoryName = '';
  let categoryId = '';
  
  // Ensure categories are loaded
  if (!mongoQuizCategories || mongoQuizCategories.length === 0) {
    try {
      const catRes = await apiFetch('/api/categories');
      if (catRes.ok) mongoQuizCategories = await catRes.json();
    } catch (e) {
      console.error('Failed to load categories for quiz:', e);
    }
  }

  // Check if subjectId matches a category ID in mongoQuizCategories
  let matchingCat = mongoQuizCategories.find(c => c.id === subjectId || c._id === subjectId);
  if (!matchingCat) {
    // Search by legacy key in CATEGORY_UI_MAP
    const resolvedEntry = Object.entries(CATEGORY_UI_MAP).find(([name, ui]) => ui.legacyKeys && ui.legacyKeys.includes(subjectId));
    if (resolvedEntry) {
      const catName = resolvedEntry[0];
      matchingCat = mongoQuizCategories.find(c => c.name === catName);
    }
  }

  if (matchingCat) {
    categoryId = matchingCat.id || matchingCat._id;
    categoryName = matchingCat.name;
    const ui = CATEGORY_UI_MAP[categoryName] || { part: 'p1', icon: '📚' };
    pt = PARTS.find(p => p.id === ui.part);
    currentSubject = {
      id: categoryId,
      part: ui.part,
      name: categoryName,
      icon: ui.icon,
      partObj: pt,
      isFirestoreCat: true
    };
  } else {
    alert('ไม่พบหมวดข้อสอบที่ระบุ');
    return;
  }

  const loader = document.getElementById('authLoader');
  if (loader) loader.style.display = 'flex';

  let pool = [];

  try {
    const qRes = await apiFetch(`/api/questions/random?categoryId=${encodeURIComponent(categoryId)}&limit=100`, { auth: false });
    let rawQsData = {};
    try {
      rawQsData = await qRes.json();
    } catch (parseErr) {
      console.error('Failed to parse random questions response JSON:', parseErr);
    }
    
    const rawQs = Array.isArray(rawQsData) ? rawQsData : (rawQsData.questions || []);
    
    if (qRes.ok && Array.isArray(rawQs)) {
      pool = rawQs
        .map(normalizeQuestionForClient)
        .filter(q =>
          q.q &&
          Array.isArray(q.opts) &&
          q.opts.length >= 2 &&
          Number.isInteger(q.ans) &&
          q.ans >= 0
        );
      
      if (pool.length === 0) {
        console.error('[QUIZ_LOAD_FAILED] No valid questions parsed:', {
          categoryId,
          categoryName,
          status: qRes.status,
          responseShape: rawQsData,
        });
      }
    } else {
      console.error('[QUIZ_LOAD_FAILED] API response not ok or questions not array:', {
        categoryId,
        categoryName,
        status: qRes.status,
        responseShape: rawQsData,
      });
    }
  } catch (e) {
    console.error('Error fetching questions from database:', e);
  } finally {
    if (loader) loader.style.display = 'none';
  }

  if (pool.length === 0) {
    console.error('❌ [QUIZ-ERROR] Loaded question pool is empty. API failed or returned 0 questions.');
    alert('ไม่สามารถโหลดข้อสอบได้ กรุณาลองใหม่อีกครั้ง');
    return;
  }

  currentQuestions = pool;
  currentQ = 0;
  userAnswers = new Array(pool.length).fill(-1);
  quizStartTime = Date.now();
  answered = false;
  finishingQuiz = false;
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  showPage('quiz');
  renderQuestion();
}

async function startMongoQuiz(categoryId) {
  startQuiz(categoryId);
}

async function startExamSet(id) {
  try {
    const response = await apiFetch(`/api/exam-sets/${encodeURIComponent(id)}/start`, { method: 'POST' });
    const session = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) throw new Error('กรุณาเข้าสู่ระบบใหม่');
      throw new Error(session.error || 'ไม่สามารถเริ่มชุดข้อสอบได้');
    }
    if (!Array.isArray(session.questions) || session.questions.length !== session.totalQuestions) throw new Error('ระบบได้รับข้อสอบไม่ครบตามจำนวนที่กำหนด');
    const firstCategory = session.categoryRules?.[0];
    currentSubject = {
      id: `exam-set:${session.examSetId}`,
      categoryId: String(firstCategory?.categoryId || ''),
      name: session.title,
      icon: session.mode === 'exam' ? '⏱️' : '📝',
      part: 'exam-set',
      partObj: { short: session.mode === 'exam' ? 'โหมดสอบจริง' : 'โหมดฝึกทำ', bg: 'rgba(240,192,64,.12)', tc: '#f0c040' },
      examSet: {
        id: String(session.examSetId),
        title: session.title,
        mode: session.mode,
        timeLimitMinutes: session.timeLimitMinutes,
        passingScorePercent: session.passingScorePercent,
        showExplanationAfterSubmit: session.showExplanationAfterSubmit,
      },
    };
    currentQuestions = session.questions.map((question) => ({
      questionId: question._id,
      q: question.questionText,
      opts: question.choices,
      ans: question.correctAnswerIndex,
      explain: question.explanation || 'ไม่มีคำอธิบายเพิ่มเติม',
      topic: question.categoryName || 'ชุดข้อสอบ',
      difficulty: question.difficulty || 'medium',
    }));
    currentQ = 0;
    userAnswers = new Array(currentQuestions.length).fill(-1);
    quizStartTime = new Date(session.startedAt).getTime();
    answered = false;
    finishingQuiz = false;
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    showPage('quiz');
    updateTimer();
    renderQuestion();
  } catch (error) {
    alert(error.message || 'ไม่สามารถเริ่มชุดข้อสอบได้');
  }
}

function updateTimer() {
  if (!quizStartTime || !currentSubject) return;
  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  const examSet = currentSubject.examSet;
  if (examSet?.mode === 'exam') {
    const remaining = Math.max(0, (examSet.timeLimitMinutes * 60) - elapsed);
    const minutes = Math.floor(remaining / 60).toString().padStart(2, '0');
    const seconds = (remaining % 60).toString().padStart(2, '0');
    document.getElementById('quizBadgeTimer').textContent = `⏱ เหลือ ${minutes}:${seconds}`;
    if (remaining === 0 && !finishingQuiz) finishQuiz(true);
    return;
  }
  const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const seconds = (elapsed % 60).toString().padStart(2, '0');
  document.getElementById('quizBadgeTimer').textContent = `⏱ ${minutes}:${seconds}`;
}

function renderQuestion() {
  const q = currentQuestions[currentQ]; answered = userAnswers[currentQ] !== -1;
  const isExamMode = currentSubject.examSet?.mode === 'exam';
  const total = currentQuestions.length;
  document.getElementById('quizTitle').textContent = currentSubject.name;
  document.getElementById('quizBadgePart').textContent = currentSubject.partObj.short;
  document.getElementById('quizBadgeSubject').textContent = currentSubject.icon + ' ' + currentSubject.name;
  document.getElementById('quizBadgeProgress').textContent = `ข้อ ${currentQ+1}/${total}`;
  document.getElementById('quizProgress').style.width = ((currentQ+1) / total * 100) + '%';
  document.getElementById('btnPrev').style.display = currentQ > 0 ? '' : 'none';
  document.getElementById('btnNext').textContent = currentQ === total - 1 ? '📊 ส่งข้อสอบ' : 'ถัดไป ▶';
  const L = ['ก', 'ข', 'ค', 'ง'];
  const opts = q.opts.map((o, i) => {
    let cls = 'option-btn';
    if (answered && isExamMode) { if (i === userAnswers[currentQ]) cls += ' selected'; }
    else if (answered) { if (i === q.ans) cls += ' correct'; else if (i === userAnswers[currentQ] && userAnswers[currentQ] !== q.ans) cls += ' wrong'; }
    else if (i === userAnswers[currentQ]) cls += ' selected';
    return `<button class="${cls}" onclick="selectAnswer(${i})" ${answered ? 'disabled' : ''}><span class="opt-letter">${L[i]}</span><span>${o}</span></button>`;
  }).join('');
  const explain = answered && !isExamMode ? `<div class="explain-box">💡 <strong>เฉลย:</strong> ${q.explain}</div>` : '';
  const difficultyLabels = { easy: 'ง่าย', medium: 'ปานกลาง', hard: 'ยาก' };
  const levelText = q.difficulty ? `📊 ระดับ: ${difficultyLabels[q.difficulty] || q.difficulty}` : `📅 ปี พ.ศ. ${q.year || '-'}`;
  
  let sectionLabel = currentSubject.partObj.short;
  if (q.sectionKey) {
    const secNames = {
      analyticalAbility: 'คิดวิเคราะห์',
      englishSkill: 'อังกฤษ',
      goodCivilServant: 'ข้าราชการที่ดี'
    };
    sectionLabel = `หมวด: ${secNames[q.sectionKey] || q.sectionKey}`;
  }
  
  document.getElementById('quizContainer').innerHTML = `<div class="question-card"><div class="q-num">ข้อที่ ${currentQ+1} จาก ${total}</div><div class="q-tags"><span class="q-tag tag-year">${levelText}</span><span class="q-tag tag-topic">🏷 ${q.topic}</span><span class="q-tag tag-part">${sectionLabel}</span></div><div class="q-text">${q.q}</div><div class="options">${opts}</div>${explain}</div>`;
}

function selectAnswer(i) { if (answered) return; userAnswers[currentQ] = i; answered = true; renderQuestion(); }
function nextQ() { if (currentQ < currentQuestions.length - 1) { currentQ++; answered = userAnswers[currentQ] !== -1; renderQuestion(); } else finishQuiz(); }
function prevQ() { if (currentQ > 0) { currentQ--; answered = userAnswers[currentQ] !== -1; renderQuestion(); } }
function stopQuiz() { if (confirm(currentSubject?.examSet?.mode === 'exam' ? 'ต้องการออกจากการสอบจริงหรือไม่? ผลการสอบชุดนี้จะไม่ถูกบันทึก' : 'ต้องการหยุดทำข้อสอบหรือไม่?')) { clearInterval(timerInterval); showPage('home'); } }

async function finishQuiz(timedOut = false) {
  if (finishingQuiz) return;
  finishingQuiz = true;
  clearInterval(timerInterval);
  const rawElapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  const timeLimitSeconds = currentSubject.examSet?.timeLimitMinutes ? currentSubject.examSet.timeLimitMinutes * 60 : null;
  const elapsed = timeLimitSeconds && currentSubject.examSet?.mode === 'exam' ? Math.min(rawElapsed, timeLimitSeconds) : rawElapsed;
  const correct = currentQuestions.filter((q, i) => userAnswers[i] === q.ans).length;
  const total = currentQuestions.length; const pct = Math.round(correct / total * 100);
  
  const isRealExamA = currentSubject.isRealExamA === true;
  const analyticalCorrect = isRealExamA ? currentQuestions.filter((q, i) => q.sectionKey === 'analyticalAbility' && userAnswers[i] === q.ans).length : 0;
  const englishCorrect = isRealExamA ? currentQuestions.filter((q, i) => q.sectionKey === 'englishSkill' && userAnswers[i] === q.ans).length : 0;
  const civilCorrect = isRealExamA ? currentQuestions.filter((q, i) => q.sectionKey === 'goodCivilServant' && userAnswers[i] === q.ans).length : 0;

  const entry = {
    subjectId: currentSubject.id, subjectName: currentSubject.name, icon: currentSubject.icon,
    partShort: currentSubject.partObj.short, partId: currentSubject.part,
    correct, total, pct, elapsed,
    date: new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
    answers: [...userAnswers],
    mode: isRealExamA ? 'real_exam_a' : undefined
  };
  try {
    await apiFetch('/api/history/' + currentUser.username, {
      method: 'POST',
      body: JSON.stringify(entry)
    });
  } catch (e) {}
  
  let attemptSaveMessage = '';
  if (currentSubject.categoryId) {
    const mode = isRealExamA
      ? 'real_exam_a'
      : (currentSubject.examSet?.mode || 'practice');

    const attemptPayload = {
      categoryId: currentSubject.categoryId,
      guestName: currentUser ? undefined : 'Guest',
      mode,
      totalQuestions: total,
      correctCount: correct,
      answers: currentQuestions.map((question, index) => ({
        questionId: question.id || question.questionId || '',
        questionText: question.q || '',
        choices: question.opts || [],
        selectedAnswerIndex: userAnswers[index],
        correctAnswerIndex: question.ans,
        isCorrect: userAnswers[index] === question.ans,
        explanation: question.explain || '',
      })),
      startedAt: new Date(quizStartTime).toISOString(),
      submittedAt: new Date().toISOString(),
      durationSeconds: elapsed,
      ...(isRealExamA ? {
        sectionScores: {
          analyticalAbility: analyticalCorrect,
          englishSkill: englishCorrect,
          goodCivilServant: civilCorrect
        }
      } : {})
    };

    if (mode === 'exam' && currentSubject.examSet?.id) {
      attemptPayload.examSetId = currentSubject.examSet.id;
      attemptPayload.examSetTitle = currentSubject.examSet.title;
    }

    if (currentSubject.isPracticeHierarchy) {
      attemptPayload.practiceType = currentSubject.practiceType;
      attemptPayload.practiceTargetId = currentSubject.practiceTargetId;
      attemptPayload.practiceTitle = currentSubject.practiceTitle;
    }

    try {
      const response = await apiFetch('/api/exam-attempts', {
        method: 'POST',
        body: JSON.stringify(attemptPayload),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('[ATTEMPT_SAVE_FAILED]', {
          status: response.status,
          response: data,
          payload: attemptPayload
        });
        attemptSaveMessage = response.status === 401 ? 'กรุณาเข้าสู่ระบบใหม่เพื่อบันทึกผลสอบ' : (data.error || 'ไม่สามารถบันทึกผลสอบได้');
      }
    } catch (e) {
      console.error('[ATTEMPT_SAVE_EXCEPTION]', e);
      attemptSaveMessage = 'ไม่สามารถบันทึกผลสอบได้ กรุณาลองใหม่อีกครั้ง';
    }
  }
  
  const isPracticeHierarchy = currentSubject.isPracticeHierarchy === true;
  const passingScore = currentSubject.examSet?.passingScorePercent ?? 60;
  const pass = isRealExamA ? (correct >= 120) : (pct >= passingScore);
  
  let g;
  if (isPracticeHierarchy) {
    if (pct >= 80) {
      g = { l: 'ดีมาก', c: 'grade-a' };
    } else if (pct >= 60) {
      g = { l: 'ผ่านระดับพื้นฐาน', c: 'grade-c' };
    } else if (pct >= 40) {
      g = { l: 'ควรทบทวนเพิ่ม', c: 'grade-d' };
    } else {
      g = { l: 'แนะนำให้ฝึกซ้ำ', c: 'grade-d' };
    }
  } else {
    g = isRealExamA
      ? (pass ? { l: 'ผ่านเกณฑ์', c: 'grade-c' } : { l: 'ไม่ผ่านเกณฑ์', c: 'grade-d' })
      : (pct >= 80 ? { l: 'ดีเยี่ยม', c: 'grade-a' } : pct >= 70 ? { l: 'ดี', c: 'grade-b' } : pct >= passingScore ? { l: 'ผ่านเกณฑ์', c: 'grade-c' } : { l: 'ไม่ผ่านเกณฑ์', c: 'grade-d' });
  }

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0'), ss = (elapsed % 60).toString().padStart(2, '0');
  const timeMessage = timedOut ? ' · หมดเวลา ระบบส่งข้อสอบอัตโนมัติ' : '';
  const passingMessage = isRealExamA ? ' · เกณฑ์ผ่าน 120 คะแนน (60%)' : (currentSubject.examSet ? ` · เกณฑ์ผ่าน ${passingScore}%` : '');
  
  if (isRealExamA) {
    document.getElementById('resultCard').innerHTML = `<div class="result-score ${pass?'pass':'fail'}">${correct} / 200</div><div class="result-label">คะแนนรวมสอบจริง ภาค ก${passingMessage}${timeMessage}</div><div class="result-grade ${g.c}">${g.l}</div>${attemptSaveMessage ? `<p class="bank-error" style="margin-top:14px;text-align:left">${bankEscape(attemptSaveMessage)}</p>` : ''}`;
    document.getElementById('resultStats').innerHTML = `
      <div class="stat-card" style="grid-column: 1/-1; text-align: left; padding: 18px 24px;">
        <h4 style="font-family: 'Prompt', sans-serif; color: var(--gold); font-size: 15px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">คะแนนแยกตามส่วนการสอบ</h4>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span>1. คิดวิเคราะห์ (เต็ม 100):</span>
          <span style="font-weight: bold; color: ${analyticalCorrect>=60?'var(--green)':'var(--red)'};">${analyticalCorrect} / 100 ข้อ</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span>2. ทักษะภาษาอังกฤษ (เต็ม 50):</span>
          <span style="font-weight: bold; color: ${englishCorrect>=30?'var(--green)':'var(--red)'};">${englishCorrect} / 50 ข้อ</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
          <span>3. ข้าราชการที่ดี (เต็ม 50):</span>
          <span style="font-weight: bold; color: ${civilCorrect>=30?'var(--green)':'var(--red)'};">${civilCorrect} / 50 ข้อ</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 8px; font-size: 14px;">
          <span>เวลาที่ใช้ทั้งหมด:</span>
          <span style="font-weight: bold; color: var(--accent);">${mm}:${ss} นาที</span>
        </div>
      </div>
    `;
  } else if (isPracticeHierarchy) {
    document.getElementById('resultCard').innerHTML = `<div class="result-score pass">${pct}%</div><div class="result-label">ความแม่นยำ ${pct}% · ตอบถูก ${correct} ข้อ จาก ${total} ข้อ · ${currentSubject.name}${timeMessage}</div><div class="result-grade ${g.c}">ผลแบบฝึก: ${g.l}</div>${attemptSaveMessage ? `<p class="bank-error" style="margin-top:14px;text-align:left">${bankEscape(attemptSaveMessage)}</p>` : ''}`;
    document.getElementById('resultStats').innerHTML = `<div class="stat-card"><div class="stat-num" style="color:var(--green)">${correct}</div><div class="stat-label">ตอบถูก</div></div><div class="stat-card"><div class="stat-num" style="color:var(--red)">${total-correct}</div><div class="stat-label">ตอบผิด</div></div><div class="stat-card"><div class="stat-num" style="color:var(--accent)">${mm}:${ss}</div><div class="stat-label">เวลาที่ใช้</div></div>`;
  } else {
    document.getElementById('resultCard').innerHTML = `<div class="result-score ${pass?'pass':'fail'}">${pct}%</div><div class="result-label">${correct} ข้อถูก จาก ${total} ข้อ · ${currentSubject.name}${passingMessage}${timeMessage}</div><div class="result-grade ${g.c}">${g.l}</div>${attemptSaveMessage ? `<p class="bank-error" style="margin-top:14px;text-align:left">${bankEscape(attemptSaveMessage)}</p>` : ''}`;
    document.getElementById('resultStats').innerHTML = `<div class="stat-card"><div class="stat-num" style="color:var(--green)">${correct}</div><div class="stat-label">ตอบถูก</div></div><div class="stat-card"><div class="stat-num" style="color:var(--red)">${total-correct}</div><div class="stat-label">ตอบผิด</div></div><div class="stat-card"><div class="stat-num" style="color:var(--accent)">${mm}:${ss}</div><div class="stat-label">เวลาที่ใช้</div></div>`;
  }
  
  const showExplanation = currentSubject.examSet?.showExplanationAfterSubmit !== false;
  document.getElementById('resultReviewTitle').style.display = showExplanation ? '' : 'none';
  if (!showExplanation) {
    document.getElementById('reviewList').innerHTML = '<div class="empty-note">ชุดข้อสอบนี้ตั้งค่าไม่ให้แสดงเฉลยหลังส่งข้อสอบ</div>';
    showPage('result');
    buildHome();
    return;
  }
  const L = ['ก', 'ข', 'ค', 'ง'];
  document.getElementById('reviewList').innerHTML = currentQuestions.map((q, i) => {
    const ua = userAnswers[i]; const ok = ua === q.ans;
    const reviewSection = q.sectionKey ? ` · ${q.sectionKey === 'analyticalAbility' ? 'คิดวิเคราะห์' : q.sectionKey === 'englishSkill' ? 'อังกฤษ' : 'ข้าราชการที่ดี'}` : '';
    return `<div class="review-item ${ok?'correct-item':'wrong-item'}"><div class="q-num">ข้อ ${i+1} · ${q.topic}${reviewSection} · ปี ${q.year || '-'} ${ok?'✅':'❌'}</div><div class="review-q">${q.q}</div><div class="review-ans">${ua!==-1?`<span class="your-ans">คำตอบคุณ: ${L[ua]}. ${q.opts[ua]}</span>`:'<span class="your-ans">ไม่ได้ตอบ</span>'}<span class="right-ans">เฉลย: ${L[q.ans]}. ${q.opts[q.ans]}</span></div><div class="explain-box" style="margin-top:8px">💡 ${q.explain}</div></div>`;
  }).join('');
  showPage('result');
  buildHome();
}

function retryQuiz() {
  if (currentSubject?.examSet?.id) { startExamSet(currentSubject.examSet.id); return; }
  currentSubject.id.startsWith('mongo:') ? startMongoQuiz(currentSubject.categoryId) : startQuiz(currentSubject.id);
}

// ===== STATS =====
let statsAttempts = [];
let historyPage = 1;
let historyCursorStack = [null];
let historyNextCursor = null;
let historyHasNextPage = false;

function showStatsError(message = '') {
  const element = document.getElementById('statsError');
  element.textContent = message;
  element.style.display = message ? 'block' : 'none';
}

function formatAttemptDuration(seconds) {
  const value = Number(seconds) || 0;
  return `${Math.floor(value / 60).toString().padStart(2, '0')}:${(value % 60).toString().padStart(2, '0')}`;
}

function formatAttemptDate(value) {
  return value ? new Date(value).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

function renderStatsSummary(cards) {
  document.getElementById('statsOverall').innerHTML = cards.map((card) => `<div class="stat-big"><div class="num" style="color:${card.color}">${card.value}</div><div class="lbl">${card.label}</div></div>`).join('');
}

function renderStatsInsights(items) {
  document.getElementById('statsInsights').innerHTML = items.filter(Boolean).map((item) => `<span>${bankEscape(item)}</span>`).join('');
}

function renderScoreTrend(trend) {
  const element = document.getElementById('statsTrend');
  if (!trend?.length) {
    element.innerHTML = '<div class="empty-note">ยังไม่มีประวัติการทำข้อสอบ</div>';
    return;
  }
  element.innerHTML = trend.map((item) => `<div class="trend-item"><div class="trend-bar-wrap"><div class="trend-bar" style="height:${Math.max(item.scorePercent, 3)}%" title="${item.scorePercent}%"></div></div><strong>${item.scorePercent}%</strong><br><span>${new Date(item.submittedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span></div>`).join('');
}

function renderCategoryStats(categoryStats) {
  const element = document.getElementById('barChart');
  if (!categoryStats?.length) {
    element.innerHTML = '<div class="empty-note">ยังไม่มีข้อมูลแยกตามหมวด</div>';
    return;
  }
  element.innerHTML = categoryStats.map((stat) => `<div class="bar-row"><div class="bar-label">${bankEscape(stat.categoryName)}</div><div class="bar-bg"><div class="bar-fill" style="width:${stat.averageScore}%"></div></div><div class="bar-val">${stat.averageScore}% (${stat.attempts})</div></div>`).join('');
}

async function populateStatsAdminFilters() {
  const [usersResponse, categories] = await Promise.all([
    adminRequest('/api/users?limit=100'),
    adminRequest('/api/categories?includeInactive=true'),
  ]);
  const users = Array.isArray(usersResponse) ? usersResponse : (usersResponse.users || []);
  const userSelect = document.getElementById('statsUserFilter');
  const categorySelect = document.getElementById('statsCategoryFilter');
  const selectedUser = userSelect.value;
  const selectedCategory = categorySelect.value;
  userSelect.innerHTML = `<option value="">ผู้ใช้ทั้งหมด</option>${users.map((user) => `<option value="${user.id}">${bankEscape(user.name)} (${bankEscape(user.email || user.username)})</option>`).join('')}`;
  categorySelect.innerHTML = `<option value="">ทุกหมวดข้อสอบ</option>${categories.map((category) => `<option value="${category._id}">${bankEscape(category.name)}</option>`).join('')}`;
  userSelect.value = users.some((user) => user.id === selectedUser) ? selectedUser : '';
  categorySelect.value = categories.some((category) => String(category._id) === selectedCategory) ? selectedCategory : '';
}

async function renderStats() {
  const isAdmin = currentUser?.role === 'admin';
  document.getElementById('statsPageTitle').textContent = isAdmin ? '📊 Dashboard ประวัติ / สถิติ' : '📊 ประวัติ / สถิติของฉัน';
  document.getElementById('statsPageSubtitle').textContent = isAdmin ? 'ภาพรวมผู้สอบทั้งหมดและประวัติการทำข้อสอบ' : 'สรุปผลการทำข้อสอบจากคลังข้อสอบของคุณ';
  document.getElementById('statsAdminFilters').style.display = isAdmin ? '' : 'none';
  document.getElementById('statsAdminLeaderboard').style.display = isAdmin ? '' : 'none';
  document.getElementById('attemptDetail').style.display = 'none';
  showStatsError();
  try {
    if (isAdmin) {
      const overview = await adminRequest('/api/stats/overview');
      renderStatsSummary([
        { value: overview.totalUsers, label: 'ผู้ใช้ทั้งหมด', color: 'var(--gold)' },
        { value: overview.totalQuestions, label: 'ข้อสอบทั้งหมด', color: 'var(--accent)' },
        { value: overview.totalAttempts, label: 'ครั้งที่ทำข้อสอบ', color: 'var(--green)' },
        { value: `${overview.averageScore}%`, label: 'คะแนนเฉลี่ยรวม', color: 'var(--purple)' },
      ]);
      renderScoreTrend([]);
      renderCategoryStats(overview.categoryStats);
      renderStatsInsights([
        overview.mostAttemptedCategory ? `หมวดที่มีคนทำมากที่สุด: ${overview.mostAttemptedCategory.categoryName} (${overview.mostAttemptedCategory.attempts} ครั้ง)` : '',
        overview.lowestScoreCategory ? `หมวดคะแนนเฉลี่ยต่ำสุด: ${overview.lowestScoreCategory.categoryName} (${overview.lowestScoreCategory.averageScore}%)` : '',
        overview.examSetStats?.[0] ? `ชุดข้อสอบที่มีคนทำมากที่สุด: ${overview.examSetStats[0].examSetTitle} (${overview.examSetStats[0].attempts} ครั้ง)` : '',
      ]);
      document.getElementById('statsTopUsers').innerHTML = overview.topUsers.length ? overview.topUsers.map((user) => `<tr><td>${bankEscape(user.name)}<br><span style="color:var(--muted);font-size:12px">${bankEscape(user.email)}</span></td><td>${user.attempts}</td><td>${user.averageScore}%</td><td>${user.bestScore}%</td></tr>`).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--muted)">ยังไม่มีข้อมูลผู้สอบ</td></tr>';
      await populateStatsAdminFilters();
    } else {
      const stats = await adminRequest('/api/stats/me');
      renderStatsSummary([
        { value: stats.totalAttempts, label: 'ทำข้อสอบแล้ว', color: 'var(--gold)' },
        { value: `${stats.averageScore}%`, label: 'คะแนนเฉลี่ย', color: 'var(--accent)' },
        { value: `${stats.bestScore}%`, label: 'คะแนนสูงสุด', color: 'var(--green)' },
        { value: stats.latestScore === null ? '—' : `${stats.latestScore}%`, label: 'คะแนนล่าสุด', color: 'var(--purple)' },
      ]);
      renderScoreTrend(stats.trend);
      renderCategoryStats(stats.categoryStats);
      renderStatsInsights([
        stats.mostFrequentCategory ? `หมวดที่ทำบ่อยที่สุด: ${stats.mostFrequentCategory.categoryName} (${stats.mostFrequentCategory.attempts} ครั้ง)` : '',
        stats.lowestScoreCategory ? `หมวดที่ควรทบทวน: ${stats.lowestScoreCategory.categoryName} (${stats.lowestScoreCategory.averageScore}%)` : '',
        stats.examSetStats?.[0] ? `ทำชุดข้อสอบ: ${stats.examSetStats[0].examSetTitle} (${stats.examSetStats[0].attempts} ครั้ง)` : '',
      ]);
    }
    await loadStatsAttempts(true);
  } catch (error) {
    showStatsError(error.message || 'ไม่สามารถโหลดสถิติได้');
  }
}

async function loadStatsAttempts(resetPage = false) {
  if (resetPage) {
    historyPage = 1;
    historyCursorStack = [null];
    historyNextCursor = null;
    historyHasNextPage = false;
  }
  try {
    const isAdmin = currentUser?.role === 'admin';
    const limit = 20;
    const params = new URLSearchParams({ limit: String(limit) });
    
    const cursor = historyCursorStack[historyPage - 1];
    if (cursor) {
      params.set('startAfter', cursor);
    }
    
    if (isAdmin) {
      const userId = document.getElementById('statsUserFilter').value;
      const categoryId = document.getElementById('statsCategoryFilter').value;
      const dateFrom = document.getElementById('statsDateFrom').value;
      const dateTo = document.getElementById('statsDateTo').value;
      if (userId) params.set('userId', userId);
      if (categoryId) params.set('categoryId', categoryId);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
    }
    const response = await adminRequest(`/api/exam-attempts?${params.toString()}`);
    statsAttempts = response.attempts || [];
    
    historyNextCursor = response.nextCursor || null;
    historyHasNextPage = !!response.hasNextPage;
    
    const label = document.getElementById('historyPageLabel');
    if (label) {
      label.textContent = `หน้า ${historyPage}`;
    }
    const btnPrev = document.getElementById('btnHistoryPrev');
    if (btnPrev) {
      btnPrev.disabled = historyPage <= 1;
    }
    const btnNext = document.getElementById('btnHistoryNext');
    if (btnNext) {
      btnNext.disabled = !historyHasNextPage;
    }
    
    document.getElementById('attemptHistoryTitle').textContent = isAdmin ? 'ประวัติผู้สอบทั้งหมด' : 'ประวัติการทดสอบของฉัน';
    renderStatsAttempts(isAdmin);
  } catch (error) { showStatsError(error.message || 'ไม่สามารถโหลดประวัติได้'); }
}

function changeHistoryPage(offset) {
  if (offset === 1) {
    if (historyHasNextPage) {
      historyCursorStack[historyPage] = historyNextCursor;
      historyPage += 1;
      loadStatsAttempts(false);
    }
  } else if (offset === -1) {
    if (historyPage > 1) {
      historyPage -= 1;
      loadStatsAttempts(false);
    }
  }
}

function renderStatsAttempts(isAdmin) {
  const list = document.getElementById('historyBody');
  if (!statsAttempts.length) {
    list.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px">ยังไม่มีประวัติการทำข้อสอบ</td></tr>';
    return;
  }
  list.innerHTML = statsAttempts.map((attempt) => {
    const id = attempt._id || attempt.id;
    const user = attempt.userId;
    const userLabel = isAdmin ? bankEscape(user?.name || attempt.guestName || 'ผู้ใช้ที่ไม่ระบุ') : 'ฉัน';
    
    const isRealExam = attempt.mode === 'real_exam_a';
    const category = isRealExam ? 'จำลองสอบจริง ภาค ก' : bankEscape(attempt.categoryName || attempt.categoryId?.name || 'ไม่ระบุหมวด');
    const examSetLabel = isRealExam 
      ? `สอบจริง ภาค ก<br><span class="status-badge ${attempt.passed ? 'status-approved' : 'status-rejected'}">${attempt.passed ? 'ผ่าน' : 'ไม่ผ่าน'}</span>`
      : (attempt.examSetTitle ? `${bankEscape(attempt.examSetTitle)}<br><span class="status-badge ${attempt.passed ? 'status-approved' : 'status-rejected'}">${attempt.passed ? 'ผ่าน' : 'ไม่ผ่าน'}</span>` : '—');
    
    return `<tr><td>${formatAttemptDate(attempt.submittedAt)}</td><td>${userLabel}</td><td>${category}</td><td>${examSetLabel}</td><td>${attempt.correctCount}/${attempt.totalQuestions}</td><td><span class="attempt-status">${attempt.scorePercent}%</span></td><td>${formatAttemptDuration(attempt.durationSeconds)}</td><td><button class="btn btn-secondary btn-sm" onclick="viewAttemptDetail('${id}')">ดูรายละเอียด</button></td></tr>`;
  }).join('');
}

async function viewAttemptDetail(id) {
  try {
    const attempt = await adminRequest(`/api/exam-attempts/${id}`);
    const detail = document.getElementById('attemptDetail');
    if (attempt.showExplanationAfterSubmit === false && currentUser?.role !== 'admin') {
      detail.innerHTML = `<h3>${bankEscape(attempt.mode === 'real_exam_a' ? 'สอบจริง ภาค ก' : (attempt.examSetTitle || attempt.categoryName || 'ผลการทดสอบ'))}</h3><p>คะแนน ${attempt.scorePercent}% · ${attempt.correctCount}/${attempt.totalQuestions} · เวลา ${formatAttemptDuration(attempt.durationSeconds)}</p><div class="empty-note">ชุดข้อสอบนี้ตั้งค่าไม่ให้แสดงเฉลยย้อนหลัง</div>`;
      detail.style.display = 'block';
      detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const labels = ['A', 'B', 'C', 'D'];
    const answers = attempt.answers || [];
    const answerHtml = answers.length ? answers.map((answer, index) => {
      const selected = answer.selectedAnswerIndex === undefined || answer.selectedAnswerIndex === -1 ? 'ไม่ได้ตอบ' : `${labels[answer.selectedAnswerIndex]}. ${bankEscape(answer.choices?.[answer.selectedAnswerIndex] || '—')}`;
      const correct = answer.correctAnswerIndex === undefined ? '—' : `${labels[answer.correctAnswerIndex]}. ${bankEscape(answer.choices?.[answer.correctAnswerIndex] || '—')}`;
      return `<div class="review-item ${answer.isCorrect ? 'correct-item' : 'wrong-item'}"><div class="q-num">ข้อ ${index + 1} ${answer.isCorrect ? '✅ ถูก' : '❌ ผิด'}</div><div class="review-q">${bankEscape(answer.questionText || 'ไม่มี snapshot คำถาม')}</div><div class="review-ans"><span class="your-ans">คำตอบที่เลือก: ${selected}</span><span class="right-ans">คำตอบที่ถูก: ${correct}</span></div>${answer.explanation ? `<div class="explain-box">💡 ${bankEscape(answer.explanation)}</div>` : ''}</div>`;
    }).join('') : '<div class="empty-note">Attempt นี้ไม่มีรายละเอียดคำตอบย้อนหลัง</div>';
    
    const isRealExam = attempt.mode === 'real_exam_a';
    const heading = isRealExam ? 'สอบจริง ภาค ก' : (attempt.examSetTitle || attempt.categoryName || attempt.categoryId?.name || 'ผลการทดสอบ');
    const passedLabel = (attempt.examSetTitle || isRealExam) ? ` · ${attempt.passed ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์'}` : '';
    
    let sectionScoresHtml = '';
    if (isRealExam && attempt.sectionScores) {
      sectionScoresHtml = `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 16px; margin: 10px 0 16px; font-size: 13.5px; line-height: 1.6;">
          <strong style="color: var(--gold);">คะแนนแยกส่วน:</strong><br>
          - คิดวิเคราะห์: ${attempt.sectionScores.analyticalAbility || 0} / 100 ข้อ<br>
          - ภาษาอังกฤษ: ${attempt.sectionScores.englishSkill || 0} / 50 ข้อ<br>
          - ข้าราชการที่ดี: ${attempt.sectionScores.goodCivilServant || 0} / 50 ข้อ
        </div>
      `;
    }
    
    detail.innerHTML = `<h3>${bankEscape(heading)}</h3><p>คะแนน ${attempt.scorePercent}% · ${attempt.correctCount}/${attempt.totalQuestions} · เวลา ${formatAttemptDuration(attempt.durationSeconds)}${passedLabel}</p>${sectionScoresHtml}${answerHtml}`;
    detail.style.display = 'block';
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { showStatsError(error.message || 'ไม่สามารถโหลดรายละเอียดผลสอบได้'); }
}

async function exportAttempts() {
  if (currentUser?.role !== 'admin') return;
  try {
    const params = new URLSearchParams({ limit: '100' });
    const userId = document.getElementById('statsUserFilter').value;
    const categoryId = document.getElementById('statsCategoryFilter').value;
    const dateFrom = document.getElementById('statsDateFrom').value;
    const dateTo = document.getElementById('statsDateTo').value;
    if (userId) params.set('userId', userId);
    if (categoryId) params.set('categoryId', categoryId);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const response = await adminRequest(`/api/exam-attempts?${params.toString()}`);
    const blob = new Blob([JSON.stringify(response.attempts || [], null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'krupuchuay-exam-attempts.json';
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) { showStatsError(error.message || 'ไม่สามารถ export ประวัติได้'); }
}

// ===== ADMIN =====
let adminUsersPage = 1;
let adminUsersCursorStack = [null];
let adminUsersNextCursor = null;
let adminUsersHasNextPage = false;
const STATUS_LABEL = { approved: '🟢 อนุมัติแล้ว', pending: '🟡 รออนุมัติ', rejected: '🔴 ถูกปฏิเสธ' };

async function renderAdmin(resetPage = false) {
  await renderPendingUsers();
  if (resetPage) {
    adminUsersPage = 1;
    adminUsersCursorStack = [null];
    adminUsersNextCursor = null;
    adminUsersHasNextPage = false;
  }
  try {
    const limit = 50;
    const params = new URLSearchParams({ limit: String(limit) });
    const cursor = adminUsersCursorStack[adminUsersPage - 1];
    if (cursor) {
      params.set('startAfter', cursor);
    }
    
    const res = await apiFetch(`/api/users?${params.toString()}`);
    if (!res.ok) return;
    
    const response = await res.json();
    let users = [];
    if (response && typeof response === 'object' && !Array.isArray(response)) {
      users = response.users || [];
      adminUsersNextCursor = response.nextCursor || null;
      adminUsersHasNextPage = !!response.hasNextPage;
    } else if (Array.isArray(response)) {
      users = response;
      adminUsersNextCursor = null;
      adminUsersHasNextPage = false;
    }
    
    const label = document.getElementById('userPageLabel');
    if (label) {
      label.textContent = `หน้า ${adminUsersPage}`;
    }
    const btnPrev = document.getElementById('btnUserPrev');
    if (btnPrev) {
      btnPrev.disabled = adminUsersPage <= 1;
    }
    const btnNext = document.getElementById('btnUserNext');
    if (btnNext) {
      btnNext.disabled = !adminUsersHasNextPage;
    }

    document.getElementById('userList').innerHTML = users.map(u => {
      const status = u.approvalStatus;
      const statusBadge = `<span class="status-badge status-${status}">${STATUS_LABEL[status] || status}</span>`;
      const legacyBadge = u.isLegacy ? '<span class="status-badge legacy-badge">บัญชีเก่า/Legacy</span>' : '';
      const createdAt = u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
      const isCurrentUser = u.id === currentUser.id || u.username === currentUser.username;
      const actions = [];
      if (u.isLegacy) actions.push(`<button class="btn btn-primary btn-sm" onclick="addLegacyEmail('${u.id}','${u.name.replace(/'/g,'')}')">เพิ่มอีเมล</button>`);
      if (isCurrentUser) {
        actions.push('<span style="font-size:12px;color:var(--muted)">บัญชีของคุณ</span>');
      } else if (u.role === 'user') {
        if (status === 'approved') actions.push(`<button class="btn btn-danger btn-sm" onclick="setUserStatus('${u.id}','${u.name.replace(/'/g,'')}','rejected')">ระงับสิทธิ์</button>`);
        if (status === 'rejected') actions.push(`<button class="btn btn-success btn-sm" onclick="setUserStatus('${u.id}','${u.name.replace(/'/g,'')}','approved')">เปิดสิทธิ์</button>`);
        actions.push(`<button class="btn btn-danger btn-sm" onclick="deleteUser('${u.id}','${u.name.replace(/'/g,'')}')">ลบ</button>`);
      } else {
        actions.push('<span style="font-size:12px;color:var(--muted)">บัญชีผู้ดูแลระบบ</span>');
      }
      const accountLabel = u.email || `ไม่มีอีเมล · username: ${u.username}`;
      return `<div class="user-item"><div class="user-info"><div class="uname">${u.role==='admin'?'👑':'👤'} ${u.name} ${statusBadge}${legacyBadge}</div><div class="urole">${accountLabel} · ${u.role} · สมัครเมื่อ ${createdAt}</div></div><div class="pending-actions">${actions.join('')}</div></div>`;
    }).join('');
  } catch (e) {}
}

function changeAdminUsersPage(offset) {
  if (offset === 1) {
    if (adminUsersHasNextPage) {
      adminUsersCursorStack[adminUsersPage] = adminUsersNextCursor;
      adminUsersPage += 1;
      renderAdmin(false);
    }
  } else if (offset === -1) {
    if (adminUsersPage > 1) {
      adminUsersPage -= 1;
      renderAdmin(false);
    }
  }
}

async function renderPendingUsers() {
  try {
    const res = await apiFetch('/api/users/pending');
    if (!res.ok) return;
    const pending = await res.json();
    const badge = document.getElementById('pendingBadge');
    if (pending.length) { badge.textContent = pending.length; badge.style.display = ''; }
    else { badge.style.display = 'none'; }
    const list = document.getElementById('pendingUserList');
    if (!pending.length) { list.innerHTML = '<div class="empty-note">ไม่มีคำขอสมัครสมาชิกใหม่</div>'; return; }
    list.innerHTML = pending.map(u => {
      const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
      const legacyBadge = u.isLegacy ? '<span class="status-badge legacy-badge">บัญชีเก่า/Legacy</span>' : '';
      return `<div class="pending-item"><div class="user-info"><div class="uname">👤 ${u.name} <span style="color:var(--muted);font-weight:400;font-size:13px">(${u.email || u.username})</span>${legacyBadge}</div><div class="urole">สมัครเมื่อ ${date}</div></div><div class="pending-actions"><button class="btn btn-success btn-sm" onclick="approveUser('${u.id}','${u.name.replace(/'/g,'')}')">✅ อนุมัติ</button><button class="btn btn-danger btn-sm" onclick="rejectUser('${u.id}','${u.name.replace(/'/g,'')}')">❌ ปฏิเสธ</button></div></div>`;
    }).join('');
  } catch (e) {}
}

async function approveUser(id, name) {
  try {
    const res = await apiFetch(`/api/users/${id}/approve`, { method: 'PATCH' });
    if (res.ok) { renderAdmin(); }
    else { const d = await res.json(); alert('❌ ' + d.error); }
  } catch (e) { alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
}

async function rejectUser(id, name) {
  if (!confirm('ต้องการปฏิเสธคำขอสมัครสมาชิกของ ' + name + ' หรือไม่?')) return;
  try {
    const res = await apiFetch(`/api/users/${id}/reject`, { method: 'PATCH' });
    if (res.ok) { renderAdmin(); }
    else { const d = await res.json(); alert('❌ ' + d.error); }
  } catch (e) { alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
}

async function setUserStatus(id, name, status) {
  const verb = status === 'approved' ? 'เปิดสิทธิ์ใช้งาน' : 'ระงับสิทธิ์ใช้งาน';
  if (!confirm(`ต้องการ${verb}ของ ${name} หรือไม่?`)) return;
  const endpoint = status === 'approved' ? 'approve' : 'reject';
  try {
    const res = await apiFetch(`/api/users/${id}/${endpoint}`, { method: 'PATCH' });
    if (res.ok) { renderAdmin(); }
    else { const d = await res.json(); alert('❌ ' + d.error); }
  } catch (e) { alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
}

async function addUser() {
  const name = document.getElementById('newName').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  const password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;
  const approvalStatus = document.getElementById('newApprovalStatus').value;
  if (!name || !email || !password) { alert('กรุณากรอกข้อมูลให้ครบทุกช่อง'); return; }
  try {
    const res = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, approvalStatus })
    });
    const data = await res.json();
    if (!res.ok) { alert('❌ ' + data.error); return; }
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newName').value = '';
    document.getElementById('newRole').value = 'user';
    document.getElementById('newApprovalStatus').value = 'approved';
    alert('✅ เพิ่มผู้ใช้ ' + name + ' เรียบร้อยแล้ว');
    renderAdmin();
  } catch (e) { alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
}

async function addLegacyEmail(id, name) {
  const email = prompt(`เพิ่มอีเมลให้ ${name}`);
  if (!email) return;
  try {
    const res = await apiFetch(`/api/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ email: email.trim() })
    });
    const data = await res.json();
    if (!res.ok) { alert('❌ ' + data.error); return; }
    renderAdmin();
  } catch (e) { alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
}

async function deleteUser(id, name) {
  if (!confirm('ต้องการลบผู้ใช้ ' + name + ' หรือไม่?')) return;
  try {
    const res = await apiFetch('/api/users/' + id, { method: 'DELETE' });
    if (res.ok) { renderAdmin(); }
    else { const d = await res.json(); alert('❌ ' + d.error); }
  } catch (e) { alert('เกิดข้อผิดพลาด กรุณาลองใหม่'); }
}

// ===== QUESTION BANK ADMIN =====
let bankCategories = [], bankQuestions = [], bankQuestionCounts = {}, questionSearchTimer = null;

function bankEscape(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showQuestionBankError(message = '') {
  const element = document.getElementById('questionBankError');
  element.textContent = message;
  element.style.display = message ? 'block' : 'none';
}

async function adminRequest(url, options = {}) {
  const response = await apiFetch(url, options);
  if (response.ok) return response.status === 204 ? null : response.json();
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new Error('กรุณาเข้าสู่ระบบใหม่');
  if (response.status === 403) throw new Error('ไม่มีสิทธิ์เข้าถึง');
  throw new Error(data.error || 'เกิดข้อผิดพลาดในการจัดการคลังข้อสอบ');
}

function formatBankDate(value) {
  return value ? new Date(value).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
}

function categoryIdOf(category) {
  return String(category._id || category.id);
}

function questionIdOf(question) {
  return String(question._id || question.id);
}

function populateBankCategoryOptions() {
  const filter = document.getElementById('questionFilterCategory');
  const form = document.getElementById('questionCategoryInput');
  const selectedFilter = filter.value;
  const selectedForm = form.value;
  const options = bankCategories.map(category => `<option value="${categoryIdOf(category)}">${bankEscape(category.name)}${category.isActive ? '' : ' (ปิดใช้งาน)'}</option>`).join('');
  filter.innerHTML = `<option value="">ทุกหมวดข้อสอบ</option>${options}`;
  form.innerHTML = `<option value="">เลือกหมวดข้อสอบ</option>${options}`;
  filter.value = bankCategories.some(category => categoryIdOf(category) === selectedFilter) ? selectedFilter : '';
  form.value = bankCategories.some(category => categoryIdOf(category) === selectedForm) ? selectedForm : '';
}

async function renderQuestionBank() {
  try {
    showQuestionBankError();
    bankCategories = await adminRequest('/api/categories?includeInactive=true');
    populateBankCategoryOptions();
    const allQuestions = await adminRequest('/api/questions?isActive=all');
    bankQuestionCounts = allQuestions.reduce((counts, question) => {
      const id = String(question.categoryId);
      counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {});
    renderManagedCategories();
    await loadManagedQuestions();
    await loadExamPacksStatus();
  } catch (error) {
    showQuestionBankError(error.message);
  }
}

function renderManagedCategories() {
  const list = document.getElementById('categoryManagerList');
  if (!bankCategories.length) {
    list.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">ยังไม่มีหมวดข้อสอบ</td></tr>';
    return;
  }
  list.innerHTML = bankCategories.map(category => {
    const id = categoryIdOf(category);
    const status = category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    const statusClass = category.isActive ? 'status-approved' : 'status-rejected';
    const toggleLabel = category.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
    return `<tr><td>${bankEscape(category.name)}</td><td>${bankEscape(category.description || '—')}</td><td>${category.order}</td><td><span class="status-badge ${statusClass}">${status}</span></td><td>${bankQuestionCounts[id] || 0}</td><td><div class="bank-actions"><button class="btn btn-secondary btn-sm" onclick="editCategory('${id}')">แก้ไข</button><button class="btn btn-danger btn-sm" onclick="toggleCategory('${id}')">${toggleLabel}</button></div></td></tr>`;
  }).join('');
}

function resetCategoryForm() {
  document.getElementById('editingCategoryId').value = '';
  document.getElementById('categoryNameInput').value = '';
  document.getElementById('categoryDescriptionInput').value = '';
  document.getElementById('categoryOrderInput').value = '0';
  document.getElementById('categoryActiveInput').checked = true;
}

function editCategory(id) {
  const category = bankCategories.find(item => categoryIdOf(item) === id);
  if (!category) return;
  document.getElementById('editingCategoryId').value = id;
  document.getElementById('categoryNameInput').value = category.name;
  document.getElementById('categoryDescriptionInput').value = category.description || '';
  document.getElementById('categoryOrderInput').value = category.order || 0;
  document.getElementById('categoryActiveInput').checked = category.isActive;
}

async function saveCategory() {
  const id = document.getElementById('editingCategoryId').value;
  const name = document.getElementById('categoryNameInput').value.trim();
  const description = document.getElementById('categoryDescriptionInput').value.trim();
  const order = Number(document.getElementById('categoryOrderInput').value);
  const isActive = document.getElementById('categoryActiveInput').checked;
  if (!name) { showQuestionBankError('กรุณาระบุชื่อหมวดข้อสอบ'); return; }
  try {
    await adminRequest(id ? `/api/categories/${id}` : '/api/categories', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, order: Number.isFinite(order) ? order : 0, isActive }),
    });
    resetCategoryForm();
    await renderQuestionBank();
  } catch (error) {
    showQuestionBankError(error.message);
  }
}

async function toggleCategory(id) {
  const category = bankCategories.find(item => categoryIdOf(item) === id);
  if (!category) return;
  try {
    await adminRequest(`/api/categories/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !category.isActive }),
    });
    await renderQuestionBank();
  } catch (error) { showQuestionBankError(error.message); }
}

function debouncedQuestionSearch() {
  clearTimeout(questionSearchTimer);
  questionSearchTimer = setTimeout(loadManagedQuestions, 250);
}

async function loadManagedQuestions() {
  try {
    const params = new URLSearchParams({ isActive: document.getElementById('questionFilterActive').value });
    const categoryId = document.getElementById('questionFilterCategory').value;
    const difficulty = document.getElementById('questionFilterDifficulty').value;
    const search = document.getElementById('questionSearch').value.trim();
    if (categoryId) params.set('categoryId', categoryId);
    if (difficulty) params.set('difficulty', difficulty);
    if (search) params.set('search', search);
    bankQuestions = await adminRequest(`/api/questions?${params.toString()}`);
    renderManagedQuestions();
  } catch (error) { showQuestionBankError(error.message); }
}

function renderManagedQuestions() {
  const list = document.getElementById('questionManagerList');
  const categoryNames = Object.fromEntries(bankCategories.map(category => [categoryIdOf(category), category.name]));
  if (!bankQuestions.length) {
    list.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">ไม่พบข้อสอบตามเงื่อนไข</td></tr>';
    return;
  }
  list.innerHTML = bankQuestions.map(question => {
    const id = questionIdOf(question);
    const status = question.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    const statusClass = question.isActive ? 'status-approved' : 'status-rejected';
    const toggle = question.isActive ? 'ปิดใช้' : 'เปิดใช้';
    return `<tr><td>${bankEscape(categoryNames[String(question.categoryId)] || 'ไม่พบหมวด')}</td><td class="question-summary" title="${bankEscape(question.questionText)}">${bankEscape(question.questionText)}</td><td>${bankEscape(question.difficulty)}</td><td><span class="status-badge ${statusClass}">${status}</span></td><td>${formatBankDate(question.createdAt)}</td><td><div class="bank-actions"><button class="btn btn-secondary btn-sm" onclick="viewQuestion('${id}')">ดู</button><button class="btn btn-secondary btn-sm" onclick="editQuestion('${id}')">แก้ไข</button><button class="btn btn-danger btn-sm" onclick="toggleQuestion('${id}')">${toggle}</button><button class="btn btn-danger btn-sm" onclick="deleteQuestionFromBank('${id}')">ลบ</button></div></td></tr>`;
  }).join('');
}

function resetQuestionForm() {
  document.getElementById('editingQuestionId').value = '';
  document.getElementById('questionFormTitle').textContent = 'เพิ่มข้อสอบใหม่';
  document.getElementById('questionCategoryInput').value = '';
  document.getElementById('questionDifficultyInput').value = 'medium';
  document.getElementById('questionActiveInput').checked = true;
  document.getElementById('questionTextInput').value = '';
  [0, 1, 2, 3].forEach(index => { document.getElementById(`choiceInput${index}`).value = ''; });
  document.getElementById('correctAnswerIndexInput').value = '0';
  document.getElementById('questionExplanationInput').value = '';
  document.getElementById('questionSourceInput').value = '';
}

function editQuestion(id) {
  const question = bankQuestions.find(item => questionIdOf(item) === id);
  if (!question) return;
  document.getElementById('editingQuestionId').value = id;
  document.getElementById('questionFormTitle').textContent = 'แก้ไขข้อสอบ';
  document.getElementById('questionCategoryInput').value = String(question.categoryId);
  document.getElementById('questionDifficultyInput').value = question.difficulty;
  document.getElementById('questionActiveInput').checked = question.isActive;
  document.getElementById('questionTextInput').value = question.questionText;
  question.choices.forEach((choice, index) => { document.getElementById(`choiceInput${index}`).value = choice; });
  document.getElementById('correctAnswerIndexInput').value = String(question.correctAnswerIndex);
  document.getElementById('questionExplanationInput').value = question.explanation || '';
  document.getElementById('questionSourceInput').value = question.source || '';
  document.getElementById('questionFormTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function viewQuestion(id) {
  const question = bankQuestions.find(item => questionIdOf(item) === id);
  if (!question) return;
  const labels = ['A', 'B', 'C', 'D'];
  const detail = document.getElementById('questionDetail');
  detail.textContent = `${question.questionText}\n\n${question.choices.map((choice, index) => `${labels[index]}. ${choice}`).join('\n')}\n\nคำตอบที่ถูก: ${labels[question.correctAnswerIndex]}\nคำอธิบาย: ${question.explanation || '—'}\nแหล่งที่มา: ${question.source || '—'}`;
  detail.style.display = 'block';
}

async function saveQuestion() {
  const id = document.getElementById('editingQuestionId').value;
  const categoryId = document.getElementById('questionCategoryInput').value;
  const questionText = document.getElementById('questionTextInput').value.trim();
  const choices = [0, 1, 2, 3].map(index => document.getElementById(`choiceInput${index}`).value.trim());
  const correctAnswerIndex = Number(document.getElementById('correctAnswerIndexInput').value);
  const explanation = document.getElementById('questionExplanationInput').value.trim();
  const difficulty = document.getElementById('questionDifficultyInput').value;
  const source = document.getElementById('questionSourceInput').value.trim();
  const isActive = document.getElementById('questionActiveInput').checked;
  if (!categoryId || !questionText || choices.some(choice => !choice) || !Number.isInteger(correctAnswerIndex) || correctAnswerIndex < 0 || correctAnswerIndex > 3) {
    showQuestionBankError('กรุณากรอกหมวด คำถาม ตัวเลือกทั้ง 4 และคำตอบที่ถูกต้องให้ครบ');
    return;
  }
  try {
    await adminRequest(id ? `/api/questions/${id}` : '/api/questions', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, questionText, choices, correctAnswerIndex, explanation, difficulty, source, isActive }),
    });
    resetQuestionForm();
    await renderQuestionBank();
  } catch (error) { showQuestionBankError(error.message); }
}

async function toggleQuestion(id) {
  const question = bankQuestions.find(item => questionIdOf(item) === id);
  if (!question) return;
  try {
    await adminRequest(`/api/questions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !question.isActive }) });
    await renderQuestionBank();
  } catch (error) { showQuestionBankError(error.message); }
}

async function deleteQuestionFromBank(id) {
  if (!confirm('ต้องการลบข้อสอบนี้ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้')) return;
  try {
    await adminRequest(`/api/questions/${id}`, { method: 'DELETE' });
    await renderQuestionBank();
  } catch (error) { showQuestionBankError(error.message); }
}

async function loadImportFile() {
  const file = document.getElementById('questionImportFile').files[0];
  if (!file) return;
  try { document.getElementById('questionImportInput').value = await file.text(); }
  catch (error) { showQuestionBankError('ไม่สามารถอ่านไฟล์ JSON ได้'); }
}

async function importQuestions() {
  const result = document.getElementById('importResult');
  let payload;
  try {
    const rawInput = document.getElementById('questionImportInput').value.trim();
    try {
      payload = JSON.parse(rawInput);
    } catch (jsonErr) {
      let cleanInput = rawInput;
      if (cleanInput.includes('[')) {
        const start = cleanInput.indexOf('[');
        const end = cleanInput.lastIndexOf(']');
        if (start !== -1 && end !== -1 && end > start) {
          cleanInput = cleanInput.substring(start, end + 1);
        }
      }
      payload = new Function(`return (${cleanInput})`)();
    }
    if (!Array.isArray(payload)) throw new Error();

    const activeCategoryId = document.getElementById('questionFilterCategory').value;
    const activeCategory = bankCategories.find(c => String(categoryIdOf(c)) === String(activeCategoryId));
    let defaultCategoryName = activeCategory ? activeCategory.name : '';

    if (!defaultCategoryName) {
      if (rawInput.includes('social_econ:')) {
        defaultCategoryName = 'สังคม เศรษฐกิจ การเมือง บ้านเมือง';
      } else if (rawInput.includes('const_law:')) {
        defaultCategoryName = 'รัฐธรรมนูญและกฎหมายการศึกษา';
      } else if (rawInput.includes('edu_acts:')) {
        defaultCategoryName = 'พ.ร.บ. การศึกษา / ข้าราชการครู';
      } else if (rawInput.includes('policy:')) {
        defaultCategoryName = 'นโยบายรัฐ / ปฏิรูปการศึกษา';
      } else if (rawInput.includes('civil_servant:') || rawInput.includes('kharachkan:')) {
        defaultCategoryName = 'ความรู้และลักษณะการเป็นข้าราชการที่ดี';
      } else if (rawInput.includes('thai_lang:')) {
        defaultCategoryName = 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)';
      } else if (rawInput.includes('math:') || rawInput.includes('reasoning:')) {
        defaultCategoryName = 'ความสามารถทั่วไป';
      } else if (rawInput.includes('eng_basic:')) {
        defaultCategoryName = 'ภาษาอังกฤษพื้นฐาน';
      } else if (rawInput.includes('ethics:') || rawInput.includes('prof_std:')) {
        defaultCategoryName = 'วิชาชีพครู';
      }
    }

    payload = payload.map(item => {
      const questionText = item.questionText || item.q || '';
      const choices = item.choices || item.opts || [];
      const correctAnswerIndex = item.correctAnswerIndex !== undefined ? item.correctAnswerIndex : item.ans;
      const explanation = item.explanation || item.explain || '';
      
      let difficulty = item.difficulty;
      if (!difficulty && item.level) {
        if (item.level === 'ยาก') difficulty = 'hard';
        else if (item.level === 'ปานกลาง') difficulty = 'medium';
        else difficulty = 'easy';
      }
      if (!difficulty) difficulty = 'medium';

      const source = item.source || item.topic || '';
      const categoryName = item.categoryName || defaultCategoryName;
      const isActive = item.isActive !== undefined ? item.isActive : true;

      return {
        categoryName,
        questionText,
        choices,
        correctAnswerIndex,
        explanation,
        difficulty,
        source,
        isActive
      };
    });

    const missingCategory = payload.some(item => !item.categoryName);
    if (missingCategory) {
      result.textContent = 'เกิดข้อผิดพลาด: บางข้อสอบไม่มีการระบุหมวดหมู่ และไม่ได้เลือกตัวกรองหมวดหมู่ด้านบน';
      result.style.display = 'block';
      return;
    }
  } catch (error) {
    result.textContent = 'รูปแบบข้อมูลไม่ถูกต้อง ต้องเป็น JSON array หรือรูปแบบข้อสอบที่ส่งให้บอท';
    result.style.display = 'block';
    return;
  }
  try {
    const response = await adminRequest('/api/questions/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    result.textContent = `Import สำเร็จ ${response.imported} ข้อ · ไม่สำเร็จ ${response.failed} ข้อ${response.errors.length ? ` (${response.errors.slice(0, 3).map(error => `รายการ ${error.index + 1}: ${error.error}`).join(' | ')})` : ''}`;
    result.style.display = 'block';
    await renderQuestionBank();
  } catch (error) { showQuestionBankError(error.message); }
}

async function exportQuestions() {
  try {
    const params = new URLSearchParams({ isActive: document.getElementById('exportActiveOnly').checked ? 'true' : 'all' });
    const categoryId = document.getElementById('questionFilterCategory').value;
    if (categoryId) params.set('categoryId', categoryId);
    const questions = await adminRequest(`/api/questions?${params.toString()}`);
    const categoryNames = Object.fromEntries(bankCategories.map(category => [categoryIdOf(category), category.name]));
    const exportData = questions.map(question => ({
      categoryName: categoryNames[String(question.categoryId)] || '',
      questionText: question.questionText,
      choices: question.choices,
      correctAnswerIndex: question.correctAnswerIndex,
      explanation: question.explanation || '',
      difficulty: question.difficulty,
      source: question.source || '',
      isActive: question.isActive,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'krupuchuay-questions.json';
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (error) { showQuestionBankError(error.message); }
}

// ===== EXAM SETS =====
let examSets = [], examSetCategories = [];

function showExamSetsError(message = '') {
  const element = document.getElementById('examSetsError');
  element.textContent = message;
  element.style.display = message ? 'block' : 'none';
}

function showExamSetAdminError(message = '') {
  const element = document.getElementById('examSetAdminError');
  element.textContent = message;
  element.style.display = message ? 'block' : 'none';
}

function examSetIdOf(examSet) {
  return String(examSet._id || examSet.id);
}

function examSetModeLabel(mode) {
  return mode === 'exam' ? 'สอบจริง' : 'ฝึกทำ';
}

function examSetRuleSummary(rules) {
  return (rules || []).map((rule) => `${bankEscape(rule.categoryName)} ${rule.questionCount} ข้อ`).join(' · ');
}

async function renderExamSets() {
  const list = document.getElementById('examSetCards');
  showExamSetsError();
  list.innerHTML = '<div class="empty-note">กำลังโหลดชุดข้อสอบ...</div>';
  try {
    const response = await apiFetch('/api/exam-sets');
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 401 ? 'กรุณาเข้าสู่ระบบใหม่' : (data.error || 'ไม่สามารถโหลดชุดข้อสอบได้'));
    examSets = data;
    if (!examSets.length) {
      list.innerHTML = '<div class="empty-note">ยังไม่มีชุดข้อสอบที่เปิดใช้งาน</div>';
      return;
    }
    list.innerHTML = examSets.map((examSet) => {
      const id = examSetIdOf(examSet);
      return `<article class="exam-set-card"><div><h3>${bankEscape(examSet.title)}</h3><p>${bankEscape(examSet.description || 'ไม่มีคำอธิบายเพิ่มเติม')}</p></div><div class="exam-set-meta"><span>${examSetModeLabel(examSet.mode)}</span><span>${examSet.totalQuestions} ข้อ</span><span>${examSet.timeLimitMinutes} นาที</span><span>ผ่าน ${examSet.passingScorePercent}%</span></div><div class="exam-set-meta"><span>${examSetRuleSummary(examSet.categoryRules)}</span></div><button class="btn btn-primary" onclick="startExamSet('${id}')">เริ่ม${examSet.mode === 'exam' ? 'สอบจริง' : 'ฝึกทำ'}</button></article>`;
    }).join('');
  } catch (error) {
    list.innerHTML = '';
    showExamSetsError(error.message || 'ไม่สามารถโหลดชุดข้อสอบได้');
  }
}

function ruleCategoryOptions(selectedId = '') {
  const options = examSetCategories.map((category) => {
    const id = categoryIdOf(category);
    return `<option value="${id}">${bankEscape(category.name)}${category.isActive ? '' : ' (ปิดใช้งาน)'}</option>`;
  }).join('');
  return `<option value="">เลือกหมวดข้อสอบ</option>${options}`;
}

function addExamSetRule(rule = {}) {
  const container = document.getElementById('examSetRules');
  const row = document.createElement('div');
  row.className = 'exam-rule-row';
  row.innerHTML = `<select class="exam-set-rule-category" onchange="updateExamSetRuleTotal()">${ruleCategoryOptions(String(rule.categoryId || ''))}</select><input class="exam-set-rule-count" type="number" min="1" max="200" value="${Number.isInteger(rule.questionCount) ? rule.questionCount : 1}" oninput="updateExamSetRuleTotal()"><button type="button" class="btn btn-danger btn-sm" onclick="this.closest('.exam-rule-row').remove();updateExamSetRuleTotal()">ลบ</button>`;
  const select = row.querySelector('.exam-set-rule-category');
  select.value = String(rule.categoryId || '');
  container.appendChild(row);
  updateExamSetRuleTotal();
}

function updateExamSetRuleTotal() {
  const totalInput = document.getElementById('examSetTotalInput');
  const expected = Number(totalInput.value) || 0;
  const actual = [...document.querySelectorAll('.exam-set-rule-count')].reduce((total, input) => total + (Number(input.value) || 0), 0);
  const label = document.getElementById('examSetRuleTotal');
  label.textContent = `รวม ${actual} / ${expected} ข้อ`;
  label.classList.toggle('is-invalid', actual !== expected);
}

function resetExamSetForm() {
  document.getElementById('editingExamSetId').value = '';
  document.getElementById('examSetFormTitle').textContent = 'สร้างชุดข้อสอบใหม่';
  document.getElementById('examSetTitleInput').value = '';
  document.getElementById('examSetDescriptionInput').value = '';
  document.getElementById('examSetModeInput').value = 'exam';
  document.getElementById('examSetTotalInput').value = '50';
  document.getElementById('examSetTimeInput').value = '60';
  document.getElementById('examSetPassingInput').value = '60';
  document.getElementById('examSetActiveInput').checked = true;
  document.getElementById('examSetRandomQuestionsInput').checked = true;
  document.getElementById('examSetRandomChoicesInput').checked = false;
  document.getElementById('examSetExplanationInput').checked = true;
  document.getElementById('examSetRules').innerHTML = '';
  if (examSetCategories.length) addExamSetRule();
  else updateExamSetRuleTotal();
}

async function renderExamSetAdmin() {
  try {
    showExamSetAdminError();
    const [categories, sets] = await Promise.all([
      adminRequest('/api/categories?includeInactive=true'),
      adminRequest('/api/exam-sets?includeInactive=true'),
    ]);
    examSetCategories = categories;
    examSets = sets;
    if (!document.getElementById('editingExamSetId').value && !document.querySelector('.exam-set-rule-row')) resetExamSetForm();
    renderManagedExamSets();
  } catch (error) {
    showExamSetAdminError(error.message || 'ไม่สามารถโหลดข้อมูลชุดข้อสอบได้');
  }
}

function renderManagedExamSets() {
  const list = document.getElementById('examSetManagerList');
  if (!examSets.length) {
    list.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">ยังไม่มีชุดข้อสอบ</td></tr>';
    return;
  }
  list.innerHTML = examSets.map((examSet) => {
    const id = examSetIdOf(examSet);
    const status = examSet.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
    const statusClass = examSet.isActive ? 'status-approved' : 'status-rejected';
    const ruleLines = (examSet.categoryRules || []).map((rule) => `${bankEscape(rule.categoryName)} ${rule.questionCount}`).join('<br>');
    return `<tr><td><strong>${bankEscape(examSet.title)}</strong><br><span style="color:var(--muted)">${bankEscape(examSet.description || '—')}</span></td><td>${examSetModeLabel(examSet.mode)}</td><td>${examSet.totalQuestions} ข้อ<br>${examSet.timeLimitMinutes} นาที</td><td>${examSet.passingScorePercent}%</td><td>${ruleLines}</td><td><span class="status-badge ${statusClass}">${status}</span></td><td><div class="bank-actions"><button class="btn btn-secondary btn-sm" onclick="editExamSet('${id}')">แก้ไข</button><button class="btn btn-danger btn-sm" onclick="toggleExamSet('${id}')">${examSet.isActive ? 'ปิดใช้' : 'เปิดใช้'}</button><button class="btn btn-danger btn-sm" onclick="deleteExamSet('${id}')">ปิดใช้งาน</button></div></td></tr>`;
  }).join('');
}

function editExamSet(id) {
  const examSet = examSets.find((item) => examSetIdOf(item) === id);
  if (!examSet) return;
  document.getElementById('editingExamSetId').value = id;
  document.getElementById('examSetFormTitle').textContent = 'แก้ไขชุดข้อสอบ';
  document.getElementById('examSetTitleInput').value = examSet.title;
  document.getElementById('examSetDescriptionInput').value = examSet.description || '';
  document.getElementById('examSetModeInput').value = examSet.mode;
  document.getElementById('examSetTotalInput').value = examSet.totalQuestions;
  document.getElementById('examSetTimeInput').value = examSet.timeLimitMinutes;
  document.getElementById('examSetPassingInput').value = examSet.passingScorePercent;
  document.getElementById('examSetActiveInput').checked = examSet.isActive;
  document.getElementById('examSetRandomQuestionsInput').checked = examSet.randomizeQuestions;
  document.getElementById('examSetRandomChoicesInput').checked = examSet.randomizeChoices;
  document.getElementById('examSetExplanationInput').checked = examSet.showExplanationAfterSubmit;
  document.getElementById('examSetRules').innerHTML = '';
  (examSet.categoryRules || []).forEach((rule) => addExamSetRule(rule));
  updateExamSetRuleTotal();
  document.getElementById('examSetFormTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveExamSet() {
  const id = document.getElementById('editingExamSetId').value;
  const title = document.getElementById('examSetTitleInput').value.trim();
  const totalQuestions = Number(document.getElementById('examSetTotalInput').value);
  const categoryRules = [...document.querySelectorAll('.exam-rule-row')].map((row) => ({
    categoryId: row.querySelector('.exam-set-rule-category').value,
    questionCount: Number(row.querySelector('.exam-set-rule-count').value),
  }));
  const ruleTotal = categoryRules.reduce((total, rule) => total + (Number.isInteger(rule.questionCount) ? rule.questionCount : 0), 0);
  if (!title || !Number.isInteger(totalQuestions) || totalQuestions < 1 || categoryRules.length === 0 || categoryRules.some((rule) => !rule.categoryId || !Number.isInteger(rule.questionCount) || rule.questionCount < 1)) {
    showExamSetAdminError('กรุณาระบุชื่อ จำนวนข้อ และสัดส่วนหมวดข้อสอบให้ครบถ้วน');
    return;
  }
  if (ruleTotal !== totalQuestions) {
    showExamSetAdminError('ผลรวมจำนวนข้อในสัดส่วนหมวดต้องเท่ากับจำนวนข้อรวม');
    return;
  }
  const payload = {
    title,
    description: document.getElementById('examSetDescriptionInput').value.trim(),
    mode: document.getElementById('examSetModeInput').value,
    totalQuestions,
    timeLimitMinutes: Number(document.getElementById('examSetTimeInput').value),
    passingScorePercent: Number(document.getElementById('examSetPassingInput').value),
    isActive: document.getElementById('examSetActiveInput').checked,
    randomizeQuestions: document.getElementById('examSetRandomQuestionsInput').checked,
    randomizeChoices: document.getElementById('examSetRandomChoicesInput').checked,
    showExplanationAfterSubmit: document.getElementById('examSetExplanationInput').checked,
    categoryRules,
  };
  try {
    await adminRequest(id ? `/api/exam-sets/${id}` : '/api/exam-sets', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    resetExamSetForm();
    await renderExamSetAdmin();
  } catch (error) {
    showExamSetAdminError(error.message || 'ไม่สามารถบันทึกชุดข้อสอบได้');
  }
}

async function toggleExamSet(id) {
  const examSet = examSets.find((item) => examSetIdOf(item) === id);
  if (!examSet) return;
  try {
    await adminRequest(`/api/exam-sets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !examSet.isActive }) });
    await renderExamSetAdmin();
  } catch (error) { showExamSetAdminError(error.message); }
}

async function deleteExamSet(id) {
  if (!confirm('ต้องการปิดใช้งานชุดข้อสอบนี้หรือไม่? ข้อมูลและประวัติการสอบจะยังคงอยู่')) return;
  try {
    await adminRequest(`/api/exam-sets/${id}`, { method: 'DELETE' });
    await renderExamSetAdmin();
  } catch (error) { showExamSetAdminError(error.message); }
}

// ===== EXAM PACK MANAGEMENT UI =====
async function loadExamPacksStatus() {
  const tbody = document.getElementById('examPackManagerList');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: #888;">กำลังโหลดสถานะ...</td></tr>';
  
  try {
    const res = await apiFetch('/api/admin/exam-packs/status');
    if (!res.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลสถานะได้');
    }
    const data = await res.json();
    tbody.innerHTML = '';
    
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color: #888;">ไม่พบข้อมูลหมวดวิชา</td></tr>';
      return;
    }
    
    data.forEach(pack => {
      let statusHtml = '';
      if (pack.status === 'published') {
        statusHtml = `<span style="background: #e6f4ea; color: #137333; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">Published</span>`;
      } else if (pack.status === 'stale') {
        statusHtml = `<span style="background: #fef7e0; color: #b06000; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">Stale (ข้อมูลไม่อัปเดต)</span>`;
      } else if (pack.status === 'error') {
        const safeErr = (pack.lastError || '').replace(/"/g, '&quot;');
        statusHtml = `<span style="background: #fce8e6; color: #c5221f; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem; cursor: pointer;" title="${safeErr}" onclick="alert('ข้อผิดพลาดการคอมไพล์:\\n' + this.title)">Error ⚠️</span>`;
      } else {
        statusHtml = `<span style="background: #f1f3f4; color: #5f6368; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 0.8rem;">Missing</span>`;
      }
      
      const sizeFormatted = pack.approxSizeTotal ? (pack.approxSizeTotal / 1024).toFixed(2) + ' KB' : '0 KB';
      const compiledDate = pack.compiledAt ? new Date(pack.compiledAt).toLocaleString('th-TH') : 'ยังไม่เคยสร้าง';
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${pack.categoryName}</strong></td>
        <td>${statusHtml}</td>
        <td>${pack.version !== null ? 'v' + pack.version : '-'}</td>
        <td>${pack.activeQuestionsCount} ข้อ</td>
        <td>${pack.chunkCount} chunks</td>
        <td>${sizeFormatted}</td>
        <td style="font-size: 0.85rem; color: #666;">${compiledDate}</td>
        <td>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-secondary btn-sm" onclick="dryRunPack('${pack.categoryId}')">Dry-Run</button>
            <button class="btn btn-primary btn-sm" id="btnCompile-${pack.categoryId}" onclick="compilePack('${pack.categoryId}')">Compile</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (error) {
    console.error('loadExamPacksStatus error:', error);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: #c5221f;">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
  }
}

async function dryRunPack(categoryId) {
  try {
    const res = await apiFetch(`/api/admin/exam-packs/dry-run/${categoryId}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(`❌ Dry-run ล้มเหลว:\n${data.error || 'เกิดข้อผิดพลาด'}`);
      return;
    }
    
    let info = `🔍 ผลการทดสอบ Dry-run (${data.categoryName}):\n`;
    info += `- จำนวนคำถามที่ใช้ได้ (Active): ${data.activeQuestions} ข้อ\n`;
    info += `- จำนวน Chunks โดยประมาณ: ${data.estimatedChunkCount} chunks\n`;
    info += `- ขนาดรวมโดยประมาณ: ${(data.estimatedSizeBytes / 1024).toFixed(2)} KB\n`;
    
    if (data.warnings && data.warnings.length > 0) {
      info += `\n⚠️ คำเตือน:\n` + data.warnings.map(w => '  - ' + w).join('\n');
    }
    
    if (data.invalidQuestions && data.invalidQuestions.length > 0) {
      info += `\n❌ ข้อสอบที่ข้อมูลไม่ถูกต้อง (${data.invalidQuestions.length} ข้อ):\n` + 
              data.invalidQuestions.slice(0, 10).map(q => `  - ID: ${q.id} (ข้อที่ ${q.index + 1}): ${q.reason}`).join('\n');
      if (data.invalidQuestions.length > 10) {
        info += `\n  - และอื่นๆ อีก ${data.invalidQuestions.length - 10} ข้อ`;
      }
    } else {
      info += `\n✅ ข้อมูลข้อสอบทั้งหมดถูกต้องพร้อม Compile!`;
    }
    
    alert(info);
  } catch (error) {
    alert(`เกิดข้อผิดพลาด: ${error.message}`);
  }
}

async function compilePack(categoryId) {
  const btn = document.getElementById(`btnCompile-${categoryId}`);
  const originalText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Compiling...';
  }
  
  try {
    const res = await apiFetch(`/api/admin/exam-packs/compile/${categoryId}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(`❌ Compile ล้มเหลว:\n${data.error || 'เกิดข้อผิดพลาด'}`);
      return;
    }
    
    alert(`✅ Compile Exam Pack สำเร็จ!\n- หมวดวิชา: ${data.categoryName}\n- เวอร์ชันใหม่: v${data.version}\n- จำนวนข้อสอบที่อัปเดต: ${data.totalQuestions} ข้อ\n- จำนวนไฟล์แบ่งส่วน: ${data.chunkCount} chunks`);
    await loadExamPacksStatus();
  } catch (error) {
    alert(`เกิดข้อผิดพลาด: ${error.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

async function compileAllPacks() {
  if (!confirm('⚠️ ยืนยันการคอมไพล์ชุดข้อสอบในทุกหมวดวิชา?')) {
    return;
  }
  
  const btn = document.getElementById('btnCompileAllPacks');
  const originalText = btn ? btn.textContent : '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Compiling All...';
  }
  
  try {
    const res = await apiFetch('/api/admin/exam-packs/compile-all', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      alert(`❌ การ Compile ทั้งหมดล้มเหลว:\n${data.error || 'เกิดข้อผิดพลาด'}`);
      return;
    }
    
    let report = `📊 สรุปผลการคอมไพล์ทั้งหมด:\n`;
    report += `- สำเร็จ: ${data.compiledCount} หมวดวิชา\n`;
    report += `- ล้มเหลว: ${data.failedCount} หมวดวิชา\n`;
    
    if (data.results && data.results.length > 0) {
      report += `\n✅ หมวดวิชาที่สำเร็จ:\n` + data.results.map(r => `  - ${r.categoryName} (v${r.version}, ${r.totalQuestions} ข้อ)`).join('\n');
    }
    
    if (data.errors && data.errors.length > 0) {
      report += `\n❌ หมวดวิชาที่ล้มเหลว:\n` + data.errors.map(e => `  - ${e.categoryName}: ${e.error}`).join('\n');
    }
    
    alert(report);
    await loadExamPacksStatus();
  } catch (error) {
    alert(`เกิดข้อผิดพลาด: ${error.message}`);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }
}

// ===== REAL EXAM MODE ภาค ก =====
const REAL_EXAM_A_CONFIG = {
  title: 'สอบจริง ภาค ก',
  totalScore: 200,
  passScore: 120,
  totalTimeMinutes: 300,
  sections: {
    analyticalAbility: {
      name: 'ความสามารถในการคิดวิเคราะห์',
      questionCount: 100,
      score: 100,
      timeMinutes: 150,
      categoryId: '6a39436fc2e97ab3a084bc03' // ความสามารถทั่วไป
    },
    englishSkill: {
      name: 'ทักษะภาษาอังกฤษ',
      questionCount: 50,
      score: 50,
      timeMinutes: 90,
      categoryId: 'VWmY01Rh4BepkdUdABoR' // ภาษาอังกฤษพื้นฐาน
    },
    goodCivilServant: {
      name: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
      questionCount: 50,
      score: 50,
      timeMinutes: 60,
      categoryId: 'ZDsmRyUzRsHwLHASHRYD' // ความรู้และลักษณะการเป็นข้าราชการที่ดี
    }
  }
};

async function renderRealExamHome() {
  const container = document.getElementById('realExamContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="bank-section" style="max-width: 650px; margin: 20px auto; padding: 28px; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 48px; display: block; margin-bottom: 12px;">🏆</span>
        <h2 style="font-family: 'Prompt', sans-serif; color: var(--gold); font-size: 24px; font-weight: 800; margin-bottom: 8px;">จำลองสอบจริง ภาค ก ครูผู้ช่วย</h2>
        <p style="color: var(--muted); font-size: 14px;">ท้าทายตนเองด้วยข้อสอบจำลองเสมือนจริงตามเกณฑ์มาตรฐาน ก.ค.ศ.</p>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 18px; margin-bottom: 22px;">
        <h4 style="color: var(--text); font-family: 'Prompt', sans-serif; font-size: 15px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">โครงสร้างข้อสอบ (รวม 200 ข้อ / 300 นาที / 200 คะแนน / ผ่านเกณฑ์ 120 คะแนน)</h4>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px;">
          <span>วิชาที่ 1: ความสามารถในการคิดวิเคราะห์ (100 คะแนน)</span>
          <span style="color: var(--accent); font-weight: 600;">100 ข้อ / 150 นาที</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px;">
          <span>วิชาที่ 2: ทักษะภาษาอังกฤษ (50 คะแนน)</span>
          <span style="color: var(--accent); font-weight: 600;">50 ข้อ / 90 นาที</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13.5px;">
          <span>วิชาที่ 3: ความรู้และลักษณะการเป็นข้าราชการที่ดี (50 คะแนน)</span>
          <span style="color: var(--accent); font-weight: 600;">50 ข้อ / 60 นาที</span>
        </div>
      </div>

      <div style="background: rgba(46, 204, 113, 0.08); border: 1px solid rgba(46, 204, 113, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px; font-size: 13.5px; line-height: 1.6; color: var(--green);">
        💡 <strong>เกณฑ์การผ่านการทดสอบ:</strong><br>
        ต้องได้คะแนนรวมรวมทั้ง 3 ส่วนไม่ต่ำกว่า <strong>60% (120 คะแนนขึ้นไป)</strong> จากคะแนนเต็ม 200 คะแนน เพื่อผ่านเกณฑ์ ภาค ก
      </div>

      <div style="text-align: center;">
        <button class="btn btn-primary" onclick="startRealExamA()" style="width: 100%; padding: 14px; font-family: 'Prompt', sans-serif; font-size: 16px; font-weight: 800; border-radius: 10px;">
          🚀 เริ่มการสอบจริง (จับเวลา 300 นาที)
        </button>
      </div>
    </div>
  `;
}

async function startRealExamA() {
  const loader = document.getElementById('authLoader');
  if (loader) loader.style.display = 'flex';

  try {
    const [res1, res2, res3] = await Promise.all([
      apiFetch('/api/questions/random?categoryId=6a39436fc2e97ab3a084bc03&limit=100', { auth: false }),
      apiFetch('/api/questions/random?categoryId=VWmY01Rh4BepkdUdABoR&limit=50', { auth: false }),
      apiFetch('/api/questions/random?categoryId=ZDsmRyUzRsHwLHASHRYD&limit=50', { auth: false })
    ]);

    let q1 = [], q2 = [], q3 = [];
    if (res1.ok) {
      const d = await res1.json().catch(() => ({}));
      q1 = Array.isArray(d) ? d : (d.questions || []);
    }
    if (res2.ok) {
      const d = await res2.json().catch(() => ({}));
      q2 = Array.isArray(d) ? d : (d.questions || []);
    }
    if (res3.ok) {
      const d = await res3.json().catch(() => ({}));
      q3 = Array.isArray(d) ? d : (d.questions || []);
    }

    const processedQ1 = q1.map(normalizeQuestionForClient).map(q => { q.sectionKey = 'analyticalAbility'; return q; });
    const processedQ2 = q2.map(normalizeQuestionForClient).map(q => { q.sectionKey = 'englishSkill'; return q; });
    const processedQ3 = q3.map(normalizeQuestionForClient).map(q => { q.sectionKey = 'goodCivilServant'; return q; });

    const pool = [...processedQ1, ...processedQ2, ...processedQ3].filter(q =>
      q.q &&
      Array.isArray(q.opts) &&
      q.opts.length >= 2 &&
      Number.isInteger(q.ans) &&
      q.ans >= 0
    );

    if (pool.length === 0) {
      alert('ไม่สามารถโหลดข้อสอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
      return;
    }

    currentQuestions = pool;
    currentQ = 0;
    userAnswers = new Array(pool.length).fill(-1);
    quizStartTime = Date.now();
    answered = false;
    finishingQuiz = false;

    currentSubject = {
      id: 'real_exam_a',
      categoryId: '6a39436fc2e97ab3a084bc03',
      name: 'สอบจริง ภาค ก',
      icon: '🏆',
      isRealExamA: true,
      partObj: { id: 'real_a', name: 'จำลองสอบจริง ภาค ก', short: 'ภาค ก', bg: 'rgba(240,192,64,.12)', tc: 'var(--gold)' },
      examSet: {
        id: 'real_exam_a',
        title: 'สอบจริง ภาค ก',
        mode: 'exam',
        timeLimitMinutes: 300,
        passingScorePercent: 60,
        showExplanationAfterSubmit: true
      }
    };

    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
    showPage('quiz');
    renderQuestion();

  } catch (error) {
    console.error('Error starting real exam A:', error);
    alert('เกิดข้อผิดพลาดในการโหลดข้อสอบ กรุณาลองใหม่อีกครั้ง');
  } finally {
    if (loader) loader.style.display = 'none';
  }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', checkSession);
document.getElementById('inputPass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('inputUser').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('regPassConfirm').addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
