/**
 * Parse all hardcoded question banks (QB.<key>) from public/app.js.
 *
 * WARNING: Hardcoded QB arrays were removed after migration (Phase 5G-2).
 * This script is archival and should not be run against current app.js.
 *
 * Returns: { [key]: { questions: [...], startLine, endLine } }
 *
 * Each question has the raw shape: { q, opts, ans, explain, topic, difficulty }
 */

const fs = require('fs');
const path = require('path');

// The known mapping from QB key → Firestore category name
// Derived from the startQuiz() switch statement in app.js
const QB_KEY_TO_CATEGORY_NAME = {
  const_law: 'รัฐธรรมนูญและกฎหมายการศึกษา',
  edu_acts: 'รัฐธรรมนูญและกฎหมายการศึกษา',
  social_econ: 'สังคม เศรษฐกิจ การเมือง บ้านเมือง',
  policy: 'นโยบายรัฐ / ปฏิรูปการศึกษา',
  civil_servant: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
  kharachkan: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
  thai_lang: 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)',
  math: 'ความสามารถทั่วไป',
  reasoning: 'ความสามารถทั่วไป',
  eng_basic: 'ภาษาอังกฤษพื้นฐาน',
  ethics: 'วิชาชีพครู',
  prof_std: 'วิชาชีพครู'
};

// The known SUBJECTS list from app.js (id → display name)
const QB_KEY_TO_DISPLAY_NAME = {
  const_law: 'รัฐธรรมนูญและกฎหมายการศึกษา',
  edu_acts: 'พ.ร.บ. การศึกษา / ข้าราชการครู',
  social_econ: 'สังคม เศรษฐกิจ การเมือง บ้านเมือง',
  policy: 'นโยบายรัฐ / ปฏิรูปการศึกษา',
  civil_servant: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
  kharachkan: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
  thai_lang: 'ภาษาไทย (อ่านจับใจความ / ไวยากรณ์)',
  math: 'คณิตศาสตร์และตรรกศาสตร์',
  reasoning: 'เหตุผลและมิติสัมพันธ์',
  eng_basic: 'ภาษาอังกฤษพื้นฐาน',
  ethics: 'คุณธรรม จริยธรรม จรรยาบรรณครู',
  prof_std: 'มาตรฐานวิชาชีพและการปฏิบัติงาน'
};

/**
 * Extract all QB arrays from app.js
 * @param {string} [appJsPath] Optional override for the path
 * @returns {Object} Map of key → { questions, startLine, endLine }
 */
function parseAllQuestionBanks(appJsPath) {
  if (!appJsPath) {
    appJsPath = path.join(__dirname, '..', '..', 'public', 'app.js');
  }
  const content = fs.readFileSync(appJsPath, 'utf-8');
  const lines = content.split(/\r?\n/);

  // Find 'const QB = {' to scope our search
  const qbStartIdx = content.indexOf('const QB = {');
  if (qbStartIdx === -1) {
    throw new Error('Cannot find "const QB = {" in app.js');
  }

  // Find all "<key>: [" markers within the QB object
  const keyPattern = /^([a-z][a-z_]*): \[/;
  const result = {};
  const keyPositions = []; // { key, startCharIdx, lineNumber }

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(keyPattern);
    if (m) {
      const charIdx = content.indexOf(lines[i]);
      if (charIdx >= qbStartIdx) {
        keyPositions.push({ key: m[1], lineNumber: i + 1 });
      }
    }
  }

  // For each key, extract the array
  for (const { key, lineNumber } of keyPositions) {
    const marker = `${key}: [`;
    const startIdx = content.indexOf(marker, qbStartIdx);
    if (startIdx === -1) continue;

    const arrayStart = startIdx + marker.length - 1; // points to '['
    let depth = 0;
    let arrayEnd = -1;
    for (let i = arrayStart; i < content.length; i++) {
      if (content[i] === '[') depth++;
      if (content[i] === ']') {
        depth--;
        if (depth === 0) {
          arrayEnd = i;
          break;
        }
      }
    }

    if (arrayEnd === -1) {
      console.warn(`Warning: Cannot find closing ']' for QB.${key}`);
      continue;
    }

    const arrayStr = content.substring(arrayStart, arrayEnd + 1);

    let questions;
    try {
      questions = JSON.parse(arrayStr);
    } catch (e) {
      // Fallback: try Function constructor (safe for our controlled source)
      try {
        questions = (new Function('return ' + arrayStr))();
      } catch (e2) {
        console.warn(`Warning: Cannot parse QB.${key}: ${e.message}`);
        questions = [];
      }
    }

    // Calculate end line
    const endContent = content.substring(0, arrayEnd);
    const endLine = endContent.split(/\r?\n/).length;

    result[key] = {
      questions,
      startLine: lineNumber,
      endLine,
      count: questions.length
    };
  }

  return result;
}

module.exports = {
  parseAllQuestionBanks,
  QB_KEY_TO_CATEGORY_NAME,
  QB_KEY_TO_DISPLAY_NAME
};
