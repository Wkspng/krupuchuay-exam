require('dotenv').config({ quiet: true });

const mongoose = require('mongoose');

const BATCH_SIZE = 400;
const MODES = new Set(['--dry-run', '--execute']);
const SOURCE_COLLECTIONS = {
  users: ['users'],
  categories: ['categories'],
  questions: ['questions'],
  examSets: ['examsets', 'examSets'],
  examAttempts: ['examattempts', 'examAttempts'],
};

function parseMode() {
  const modes = process.argv.slice(2).filter((argument) => MODES.has(argument));
  if (modes.length !== 1 || process.argv.slice(2).length !== 1) {
    throw new Error('USAGE');
  }
  return modes[0];
}

function legacyId(value) {
  if (value === null || value === undefined) return null;
  return String(value);
}

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function toDate(value, fallback = null) {
  if (isValidDate(value)) return value;
  if (value) {
    const candidate = new Date(value);
    if (isValidDate(candidate)) return candidate;
  }
  return fallback;
}

function timestamps(source) {
  const createdAt = toDate(source.createdAt || source.registeredAt, new Date());
  return {
    createdAt,
    updatedAt: toDate(source.updatedAt, createdAt),
  };
}

function removeUndefined(value) {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (isValidDate(value) || value === null || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, removeUndefined(item)]),
  );
}

function convertMongoValue(value) {
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (isValidDate(value)) return value;
  if (value._bsontype === 'ObjectId') return String(value);
  if (Array.isArray(value)) return value.map(convertMongoValue);
  if (Buffer.isBuffer(value)) return value.toString('base64');

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, convertMongoValue(item)]),
  );
}

function approvalStatus(source) {
  const status = source.approvalStatus || source.status;
  if (['approved', 'pending', 'rejected'].includes(status)) return status;
  return source.isApproved === true ? 'approved' : 'pending';
}

function userPlan(source) {
  if (['free', 'yearly', 'lifetime'].includes(source.plan)) return source.plan;
  return source.lifetimeAccess ? 'lifetime' : 'free';
}

function mapUser(source) {
  const id = legacyId(source._id);
  if (!id) return null;
  const status = approvalStatus(source);
  const plan = userPlan(source);

  return removeUndefined({
    uid: id,
    email: source.email ? String(source.email).trim().toLowerCase() : null,
    name: source.name || source.username || 'Legacy user',
    role: source.role === 'admin' ? 'admin' : 'user',
    approvalStatus: status,
    isApproved: status === 'approved',
    plan,
    lifetimeAccess: Boolean(source.lifetimeAccess || plan === 'lifetime'),
    subscriptionExpiresAt: toDate(source.subscriptionExpiresAt),
    legacyMongoId: id,
    legacyUsername: source.username || null,
    ...timestamps(source),
  });
}

function mapCategory(source) {
  const id = legacyId(source._id);
  if (!id) return null;

  return removeUndefined({
    name: source.name || 'Untitled category',
    description: source.description || '',
    order: Number.isFinite(Number(source.order)) ? Number(source.order) : 0,
    isActive: source.isActive !== false,
    legacyMongoId: id,
    ...timestamps(source),
  });
}

function mapQuestion(source, lookups) {
  const id = legacyId(source._id);
  if (!id) return null;
  const categoryId = legacyId(source.categoryId);

  return removeUndefined({
    categoryId,
    categoryName: lookups.categoryNames.get(categoryId) || source.categoryName || '',
    questionText: source.questionText || '',
    choices: Array.isArray(source.choices) ? source.choices.map((choice) => String(choice)) : [],
    correctAnswerIndex: Number.isInteger(source.correctAnswerIndex) ? source.correctAnswerIndex : 0,
    explanation: source.explanation || '',
    difficulty: ['easy', 'medium', 'hard'].includes(source.difficulty) ? source.difficulty : 'medium',
    source: source.source || '',
    isActive: source.isActive !== false,
    legacyMongoId: id,
    ...timestamps(source),
  });
}

function mapExamSet(source, lookups) {
  const id = legacyId(source._id);
  if (!id) return null;
  const rules = Array.isArray(source.categoryRules) ? source.categoryRules.map((rule) => {
    const categoryId = legacyId(rule.categoryId);
    return removeUndefined({
      categoryId,
      categoryName: rule.categoryName || lookups.categoryNames.get(categoryId) || '',
      questionCount: Number(rule.questionCount) || 0,
    });
  }) : [];

  return removeUndefined({
    title: source.title || 'Untitled exam set',
    description: source.description || '',
    mode: source.mode === 'practice' ? 'practice' : 'exam',
    totalQuestions: Number(source.totalQuestions) || 0,
    timeLimitMinutes: Number(source.timeLimitMinutes) || 0,
    passingScorePercent: Number(source.passingScorePercent) || 0,
    isActive: source.isActive !== false,
    categoryRules: rules,
    randomizeQuestions: source.randomizeQuestions !== false,
    randomizeChoices: Boolean(source.randomizeChoices),
    showExplanationAfterSubmit: source.showExplanationAfterSubmit !== false,
    createdBy: legacyId(source.createdBy),
    legacyMongoId: id,
    ...timestamps(source),
  });
}

function mapExamAttempt(source, lookups) {
  const id = legacyId(source._id);
  if (!id) return null;
  const userId = legacyId(source.userId);
  const categoryId = legacyId(source.categoryId);
  const examSetId = legacyId(source.examSetId);
  const legacyUser = lookups.users.get(userId);

  return removeUndefined({
    userId,
    userEmail: legacyUser?.email || null,
    userName: legacyUser?.name || source.guestName || null,
    guestName: source.guestName || null,
    categoryId,
    categoryName: source.categoryName || lookups.categoryNames.get(categoryId) || '',
    examSetId,
    examSetTitle: source.examSetTitle || lookups.examSetTitles.get(examSetId) || '',
    mode: source.mode === 'exam' ? 'exam' : 'practice',
    totalQuestions: Number(source.totalQuestions) || 0,
    correctCount: Number(source.correctCount) || 0,
    scorePercent: Number(source.scorePercent) || 0,
    passed: typeof source.passed === 'boolean' ? source.passed : null,
    durationSeconds: Number(source.durationSeconds) || 0,
    answers: convertMongoValue(Array.isArray(source.answers) ? source.answers : []),
    startedAt: toDate(source.startedAt, timestamps(source).createdAt),
    submittedAt: toDate(source.submittedAt, timestamps(source).createdAt),
    legacyMongoId: id,
    ...timestamps(source),
  });
}

async function resolveSourceCollections(mongoDb) {
  const existing = await mongoDb.listCollections({}, { nameOnly: true }).toArray();
  const byLowerName = new Map(existing.map((collection) => [collection.name.toLowerCase(), collection.name]));
  const resolved = {};

  for (const [target, candidates] of Object.entries(SOURCE_COLLECTIONS)) {
    const collectionName = candidates
      .map((candidate) => byLowerName.get(candidate.toLowerCase()))
      .find(Boolean);
    resolved[target] = collectionName ? mongoDb.collection(collectionName) : null;
  }
  return resolved;
}

async function loadRecords(collection) {
  if (!collection) return [];
  return collection.find({}).toArray();
}

function createLookups(users, categories, examSets) {
  const userProfiles = new Map();
  const categoryNames = new Map();
  const examSetTitles = new Map();

  users.forEach((user) => {
    const profile = mapUser(user);
    if (profile) userProfiles.set(profile.legacyMongoId, profile);
  });
  categories.forEach((category) => {
    const id = legacyId(category._id);
    if (id) categoryNames.set(id, category.name || '');
  });
  examSets.forEach((examSet) => {
    const id = legacyId(examSet._id);
    if (id) examSetTitles.set(id, examSet.title || '');
  });

  return { users: userProfiles, categoryNames, examSetTitles };
}

function emptyReport() {
  return { success: 0, skipped: 0, errors: 0 };
}

function addReport(total, report) {
  total.success += report.success;
  total.skipped += report.skipped;
  total.errors += report.errors;
}

async function migrateCollection({ target, records, mapper, mode, firestore }) {
  const report = emptyReport();

  for (let offset = 0; offset < records.length; offset += BATCH_SIZE) {
    const mapped = [];
    records.slice(offset, offset + BATCH_SIZE).forEach((record) => {
      try {
        const data = mapper(record);
        if (!data || !data.legacyMongoId) {
          report.skipped += 1;
          return;
        }
        mapped.push(data);
      } catch {
        report.errors += 1;
      }
    });

    if (mode === '--dry-run') {
      report.success += mapped.length;
      continue;
    }

    try {
      const refs = mapped.map((data) => firestore.collection(target).doc(data.legacyMongoId));
      const snapshots = await firestore.getAll(...refs);
      const batch = firestore.batch();
      let writes = 0;

      snapshots.forEach((snapshot, index) => {
        if (snapshot.exists) {
          report.skipped += 1;
          return;
        }
        batch.create(refs[index], mapped[index]);
        writes += 1;
      });

      if (writes > 0) await batch.commit();
      report.success += writes;
    } catch {
      report.errors += mapped.length;
    }
  }

  console.log(`[${target}] success=${report.success} skipped=${report.skipped} errors=${report.errors}`);
  return report;
}

async function main() {
  const mode = parseMode();
  if (!process.env.MONGODB_URI) throw new Error('MISSING_MONGODB_URI');

  await mongoose.connect(process.env.MONGODB_URI);
  const sourceCollections = await resolveSourceCollections(mongoose.connection.db);
  const [users, categories, questions, examSets, examAttempts] = await Promise.all([
    loadRecords(sourceCollections.users),
    loadRecords(sourceCollections.categories),
    loadRecords(sourceCollections.questions),
    loadRecords(sourceCollections.examSets),
    loadRecords(sourceCollections.examAttempts),
  ]);
  const lookups = createLookups(users, categories, examSets);
  const firestore = mode === '--execute' ? require('../src/firebaseAdmin').db : null;
  const total = emptyReport();

  const work = [
    { target: 'users', records: users, mapper: mapUser },
    { target: 'categories', records: categories, mapper: mapCategory },
    { target: 'questions', records: questions, mapper: (record) => mapQuestion(record, lookups) },
    { target: 'examSets', records: examSets, mapper: (record) => mapExamSet(record, lookups) },
    { target: 'examAttempts', records: examAttempts, mapper: (record) => mapExamAttempt(record, lookups) },
  ];

  console.log(`Firestore migration ${mode === '--dry-run' ? 'dry run' : 'execution'} started`);
  for (const item of work) {
    const report = await migrateCollection({ ...item, mode, firestore });
    addReport(total, report);
  }
  console.log(`[total] success=${total.success} skipped=${total.skipped} errors=${total.errors}`);
}

main()
  .catch((error) => {
    if (error.message === 'USAGE') {
      console.error('Usage: node scripts/migrateMongoToFirestore.js --dry-run | --execute');
    } else if (error.message === 'MISSING_MONGODB_URI') {
      console.error('MONGODB_URI is required for migration.');
    } else {
      console.error('Migration failed. Check MongoDB connectivity and Firebase Admin credentials.');
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
