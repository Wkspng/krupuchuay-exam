/**
 * Plan remaining hardcoded category mapping for Phase 5E.
 *
 * Usage:
 *   node scripts/planRemainingHardcodedCategoryMapping.js --dry-run
 *
 * This script is READ-ONLY and will not modify Firestore.
 */

const { db } = require('../src/firebaseAdmin');
const { parseAllQuestionBanks } = require('./utils/parseHardcodedQuestionBanks');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (!dryRun) {
  console.log('Usage:');
  console.log('  node scripts/planRemainingHardcodedCategoryMapping.js --dry-run');
  process.exit(1);
}

async function main() {
  console.log('\n======================================================================');
  console.log('  PHASE 5E - PLANNING REMAINING HARDCODED CATEGORY MAPPINGS');
  console.log('======================================================================\n');

  // 1. Get existing categories and their status
  console.log('--- 1. Existing Categories in Firestore ---');
  const catSnap = await db.collection('categories').get();
  const categories = [];
  
  for (const doc of catSnap.docs) {
    const data = doc.data();
    
    // Count active questions in Firestore
    const qSnap = await db.collection('questions')
      .where('categoryId', '==', doc.id)
      .where('isActive', '==', true)
      .get();
      
    // Get exam pack status
    const indexDoc = await db.collection('examPackIndexes').doc(doc.id).get();
    let packStatus = 'missing';
    let packVer = '-';
    if (indexDoc.exists) {
      const idxData = indexDoc.data();
      packStatus = idxData.isStale ? 'stale' : (idxData.isPublished ? 'published' : 'unpublished');
      packVer = idxData.version !== undefined ? `v${idxData.version}` : '-';
    }

    categories.push({
      id: doc.id,
      name: data.name,
      isActive: data.isActive ?? true,
      activeQuestionsCount: qSnap.size,
      packStatus,
      packVer,
      order: data.order !== undefined ? data.order : '-'
    });
  }

  // Sort by order or name
  categories.sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    return String(a.name).localeCompare(String(b.name));
  });

  console.log([
    'Category ID'.padEnd(26),
    'Name'.padEnd(38),
    'Active'.padStart(6),
    'Active Qs'.padStart(9),
    'Pack Status'.padEnd(12),
    'Pack Ver'.padStart(9),
    'Order'.padStart(6)
  ].join(' | '));
  console.log('-'.repeat(120));
  categories.forEach(c => {
    console.log([
      c.id.padEnd(26),
      c.name.substring(0, 38).padEnd(38),
      String(c.isActive).padStart(6),
      String(c.activeQuestionsCount).padStart(9),
      c.packStatus.padEnd(12),
      c.packVer.padStart(9),
      String(c.order).padStart(6)
    ].join(' | '));
  });
  console.log('');

  // 2. Parse remaining question banks
  const qbData = parseAllQuestionBanks();
  const eduActs = qbData.edu_acts;
  const civilServant = qbData.civil_servant;
  const kharachkan = qbData.kharachkan;

  console.log('--- 2. Parse Remaining Hardcoded Banks ---');
  console.log(`  - QB.edu_acts: ${eduActs ? eduActs.count : 0} questions`);
  console.log(`  - QB.civil_servant: ${civilServant ? civilServant.count : 0} questions`);
  console.log(`  - QB.kharachkan: ${kharachkan ? kharachkan.count : 0} questions`);
  console.log('');

  // 3. Analyze edu_acts
  console.log('--- 3. Detailed Analysis of edu_acts (8 questions) ---');
  if (eduActs) {
    // Check overlap with existing "รัฐธรรมนูญและกฎหมายการศึกษา" (categoryId: const_law id)
    // Find category ID for "รัฐธรรมนูญและกฎหมายการศึกษา"
    const lawCat = categories.find(c => c.name === 'รัฐธรรมนูญและกฎหมายการศึกษา');
    let overlapCount = 0;
    
    if (lawCat) {
      const lawQsSnap = await db.collection('questions')
        .where('categoryId', '==', lawCat.id)
        .where('isActive', '==', true)
        .get();
      const lawQsText = new Set();
      lawQsSnap.forEach(d => lawQsText.add(d.data().questionText.trim().toLowerCase()));

      eduActs.questions.forEach((q, idx) => {
        const text = q.q.trim().toLowerCase();
        const hasOverlap = lawQsText.has(text);
        if (hasOverlap) overlapCount++;
        console.log(`    #${idx + 1}: ${q.q.substring(0, 45)}...`);
        console.log(`        Topic: ${q.topic} | Difficulty: ${q.difficulty || 'medium'} | Overlap: ${hasOverlap ? '⚠️ YES' : '✅ NO'}`);
      });
      console.log(`  Overlap with "รัฐธรรมนูญและกฎหมายการศึกษา": ${overlapCount} / ${eduActs.count} (${Math.round(overlapCount/eduActs.count*100)}%)`);
    } else {
      console.log('  ⚠️ Law category "รัฐธรรมนูญและกฎหมายการศึกษา" not found in Firestore.');
    }
  }
  console.log('');

  // 4. Analyze civil_servant and kharachkan
  console.log('--- 4. Detailed Analysis of civil_servant & kharachkan ---');
  const combinedCS = [];
  const seenCSTexts = new Set();
  let selfOverlapCount = 0;

  const processCSList = (listName, list) => {
    if (!list) return;
    list.questions.forEach((q, idx) => {
      const textKey = (q.q.trim() + '||' + (q.opts ? q.opts[0].trim() : '')).toLowerCase();
      if (seenCSTexts.has(textKey)) {
        selfOverlapCount++;
      } else {
        seenCSTexts.add(textKey);
        combinedCS.push({
          q: q.q,
          opts: q.opts,
          ans: q.ans,
          explain: q.explain,
          topic: q.topic,
          difficulty: q.difficulty || 'medium',
          from: listName
        });
      }
    });
  };

  processCSList('civil_servant', civilServant);
  processCSList('kharachkan', kharachkan);

  console.log(`  - Total combined questions: ${civilServant.count + kharachkan.count} questions`);
  console.log(`  - Unique questions: ${combinedCS.length} questions`);
  console.log(`  - Duplicates between/within keys: ${selfOverlapCount} questions`);
  
  // Topic distribution
  const topics = {};
  combinedCS.forEach(q => {
    topics[q.topic] = (topics[q.topic] || 0) + 1;
  });
  console.log('  - Topic distribution:');
  Object.entries(topics).forEach(([t, count]) => {
    console.log(`    - ${t}: ${count} qs`);
  });

  // Difficulty distribution
  const diffs = { easy: 0, medium: 0, hard: 0 };
  combinedCS.forEach(q => {
    const d = q.difficulty === 'พื้นฐาน' || q.difficulty === 'easy' ? 'easy' :
              q.difficulty === 'ปานกลาง' || q.difficulty === 'medium' ? 'medium' :
              q.difficulty === 'ยาก' || q.difficulty === 'hard' ? 'hard' : 'medium';
    diffs[d]++;
  });
  console.log(`  - Difficulty distribution: Easy=${diffs.easy}, Medium=${diffs.medium}, Hard=${diffs.hard}`);
  console.log('');

  // 5. Dry-run mapping recommendations
  console.log('--- 5. Dry-run Mapping Recommendations ---');
  const mappingPlans = [
    {
      key: 'edu_acts',
      count: eduActs ? eduActs.count : 0,
      suggestedId: categories.find(c => c.name === 'รัฐธรรมนูญและกฎหมายการศึกษา')?.id || 'N/A',
      suggestedName: 'รัฐธรรมนูญและกฎหมายการศึกษา',
      action: 'merge_into_existing',
      risk: 'low',
      note: 'เนื่องจากมีข้อสอบเพียง 8 ข้อและเป็นกฎหมาย/พรบ.การศึกษา จึงเหมาะสมที่จะยุบรวมเข้ากับหมวดกฎหมายหลักที่มีอยู่'
    },
    {
      key: 'civil_servant & kharachkan (combined)',
      count: combinedCS.length,
      suggestedId: 'NEW_CATEGORY_ID',
      suggestedName: 'ความรู้และลักษณะการเป็นข้าราชการที่ดี',
      action: 'create_new_category',
      risk: 'medium',
      note: 'สร้างหมวดใหม่เนื่องจากมีข้อสอบรวมกันถึง 72 ข้อ (คัดข้อซ้ำออกเหลือ 71 ข้อ) ซึ่งตรงตามเกณฑ์หลักสูตรสอบ ก.พ. / ครูผู้ช่วย'
    }
  ];

  console.log([
    'QB Key(s)'.padEnd(40),
    'Count'.padStart(5),
    'Suggested Cat Name'.padEnd(40),
    'Action'.padEnd(20),
    'Risk'.padEnd(8)
  ].join(' | '));
  console.log('-'.repeat(120));
  mappingPlans.forEach(p => {
    console.log([
      p.key.padEnd(40),
      String(p.count).padStart(5),
      p.suggestedName.padEnd(40),
      p.action.padEnd(20),
      p.risk.padEnd(8)
    ].join(' | '));
    console.log(`    Note: ${p.note}\n`);
  });

  console.log('======================================================================');
  console.log('  PLANNING COMPLETE (READ-ONLY DRY-RUN)');
  console.log('======================================================================\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Plan script failed:', err);
  process.exit(1);
});
