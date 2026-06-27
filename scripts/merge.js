const fs = require('fs');
const path = require('path');

const SCRATCH_DIR = 'C:\\Users\\hp it\\.gemini\\antigravity\\brain\\72aecf01-02a0-4648-9efd-0af435c5e2bf\\scratch';

// Helper to evaluate a line as a JS object
function parseLine(line) {
  let cleanLine = line.trim();
  if (cleanLine.endsWith(',')) {
    cleanLine = cleanLine.substring(0, cleanLine.length - 1);
  }
  // Wrap in parentheses to ensure it's treated as an expression/object literal
  return new Function(`return (${cleanLine})`)();
}

// 1. Read first part from const_law_raw.js
const part1Path = path.join(SCRATCH_DIR, 'const_law_raw.js');
const part1Lines = fs.readFileSync(part1Path, 'utf8').split('\n');
const questions = [];

for (const line of part1Lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('{q:')) {
    // Check if it is fully valid and not truncated
    if (trimmed.includes('explain:') && trimmed.includes('topic:') && trimmed.includes('}')) {
      try {
        const qObj = parseLine(trimmed);
        questions.push(qObj);
      } catch (e) {
        console.log('Skip invalid line in part 1:', trimmed.substring(0, 50), e.message);
      }
    }
  }
}
console.log('Extracted from part 1:', questions.length, 'questions');

// 2. Read second part from user_input_part2.json
const part2JsonPath = path.join(SCRATCH_DIR, 'user_input_part2.json');
let part2Json = fs.readFileSync(part2JsonPath, 'utf8');
if (part2Json.startsWith('\uFEFF')) {
  part2Json = part2Json.substring(1);
}
const part2Data = JSON.parse(part2Json);
const part2Content = part2Data.content;

// Save raw part 2 content for debugging
fs.writeFileSync(path.join(SCRATCH_DIR, 'const_law_part2_raw.js'), part2Content, 'utf8');

const part2Lines = part2Content.split('\n');
let part2Count = 0;
for (const line of part2Lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('{q:')) {
    try {
      const qObj = parseLine(trimmed);
      
      // Check if we already have this question (by question text) to avoid duplicates from Group 5 overlap
      const exists = questions.some(existing => existing.q === qObj.q);
      if (!exists) {
        questions.push(qObj);
        part2Count++;
      }
    } catch (e) {
      console.log('Skip invalid line in part 2:', trimmed.substring(0, 50), e.message);
    }
  }
}
console.log('Merged from part 2:', part2Count, 'questions');
console.log('Total combined questions:', questions.length);

// 3. Write combined questions to data/const_law.js
const destDir = path.join(__dirname, '../data');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
const destPath = path.join(destDir, 'const_law.js');
const outputContent = `const_law: [\n` + questions.map(q => '  ' + JSON.stringify(q) + ',').join('\n') + `\n]\n`;
fs.writeFileSync(destPath, outputContent, 'utf8');
console.log('Saved combined questions to:', destPath);
