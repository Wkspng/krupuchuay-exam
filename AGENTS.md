# AGENTS.md — Project Structure Guide

> อ่านไฟล์นี้ก่อนทุกครั้งที่จะแก้ไขโปรเจกต์

---

## Stack
- **Frontend**: Vanilla JS + CSS, served via **Firebase Hosting** (`moonlight-krupuchuay-exam.web.app`)
- **Backend**: Express.js บน **Cloud Run** (`asia-southeast1`, service: `krupuchuay-exam-api`)
- **Database**: **Firestore** (project: `moonlight-krupuchuay-exam`)
- **Auth**: Firebase Auth ID Token (ไม่มี session, ไม่มี JWT_SECRET)
- **Routing**: Firebase Hosting rewrites `/api/**` → Cloud Run

## Key Files
| ไฟล์ | หน้าที่ |
|------|---------|
| `public/app.js` | Frontend logic ทั้งหมด (auth, quiz, UI) |
| `public/index.html` | HTML shell + authLoader overlay |
| `public/style.css` | Styles |
| `server.js` | Express app entry point |
| `src/firebaseAdmin.js` | Firebase Admin SDK init |
| `routes/` | Express routers |
| `controllers/` | Route handlers |
| `services/firestoreQuestionService.js` | CRUD คลังข้อสอบ Firestore |
| `services/firestoreCategoryService.js` | CRUD categories Firestore |
| `scripts/seedThaiLang.js` | One-time seed script (ภาษาไทย) |

## Firestore Collections
| Collection | ใช้งาน |
|-----------|--------|
| `users` | Profile ผู้ใช้ (uid, email, name, role, approvalStatus) |
| `categories` | หมวดวิชา (name, order, isActive) |
| `questions` | คลังข้อสอบ (categoryId, questionText, choices[4], correctAnswerIndex, explanation, topic, source) |
| `history` | ประวัติการทำข้อสอบของแต่ละ user |
| `examSets` | ชุดข้อสอบแบบ Mock Exam |
| `examAttempts` | ผลการทำ Mock Exam |

## Practice Structure (`PRACTICE_EXAM_STRUCTURE` ใน app.js)
โครงสร้างการฝึกข้อสอบแยกหมวดวิชา แบ่งเป็น **3 ส่วนหลัก**:

| id | title | คะแนน |
|----|-------|--------|
| `analytical_ability` | ความสามารถในการคิดวิเคราะห์ | 100 |
| `english_skill` | ทักษะภาษาอังกฤษ | 50 |
| `good_civil_servant` | ความรู้และลักษณะการเป็นข้าราชการที่ดี | 50 |

ข้อสอบถูก filter ด้วย `categoryNames` (ชื่อ Firestore category) แล้ว filter ซ้ำด้วย `topic` field (keyword matching)

## Seed Scripts
```bash
npm run seed:thai-lang   # import ภาษาไทย 99 ข้อ → Firestore
npm run create-admin     # สร้าง admin user
```

## Deploy
```bash
firebase deploy --only hosting   # deploy frontend
# backend: Cloud Run auto-deploy จาก git push (หรือ manual gcloud run deploy)
```

## Rules
- **ห้าม** commit `.env` (มี Firebase keys)
- Firebase config ใน `app.js` เป็น public value — ฝังได้เลย
- ก่อนเพิ่ม sub-topic ใหม่ → ตรวจสอบว่า Firestore category ชื่อตรงกับ `categoryNames` ใน PRACTICE_EXAM_STRUCTURE
- ก่อนเพิ่มข้อสอบ → ต้องมี seed script และรันบน local ที่มี `.env` ก่อน
