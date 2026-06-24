# Full Firebase migration plan

แผนนี้ลดความเสี่ยงด้วยการทำงานแบบเพิ่มระบบใหม่ควบคู่กับ MongoDB/Render เดิม จนกว่าจะมี
regression test, backup และ rollback plan ที่ผ่านการตรวจสอบ

## Phase 1 — Firestore schema + migration

- เพิ่ม Firebase Admin SDK, schema, draft rules และ composite indexes
- ย้าย users profile (ไม่รวม password hash), categories, questions, exam sets และ attempts
- ใช้ `legacyMongoId` และ deterministic document ID เพื่อรัน migration ซ้ำได้อย่างปลอดภัย
- ตรวจ dry run ก่อน แล้วจึง execute ใน project ที่มี Firebase Admin credentials

## Phase 2 — Firebase Authentication

- สร้าง login/register flow ด้วย Firebase Auth
- ให้ผู้ใช้ตั้งรหัสผ่านใหม่หรือใช้กระบวนการ hash import ที่ตรวจสอบแล้ว
- ผูก Firebase Auth UID กับ Firestore user profile และกำหนด custom claim `admin`
- ห้ามย้ายหรือ expose MongoDB password hashes ใน client หรือ Firestore

## Phase 3 — เปลี่ยน API จาก MongoDB เป็น Firestore

- ย้าย repository/controller ทีละ feature พร้อม feature flag หรือ dual-read ที่ตรวจสอบได้
- ทดสอบ user approval, question admin, exam sets, attempts และ stats ครบก่อนสลับ traffic
- ปรับ frontend ให้เรียก Firebase Auth/Firestore หรือ API ที่ใช้ Firebase identity ตาม design ที่อนุมัติ

## Phase 4 — ปิด MongoDB dependency

- เปรียบเทียบ counts และสุ่มตรวจข้อมูล Firestore กับ MongoDB
- สำรอง MongoDB และเก็บ read-only rollback window ที่กำหนดไว้
- ถอด Mongoose/MongoDB ออกจาก production หลัง owner อนุมัติเท่านั้น

## Phase 5 — Cost, indexes และ security rules

- Deploy และทดสอบ Firestore rules ด้วย Firebase Auth ของจริง
- เพิ่มหรือปรับ indexes จาก query ที่ใช้งานจริง
- ตั้ง budget alerts, retention, monitoring และ audit logging
- review custom domains, CORS และ Cloud Run service account permissions

## Rollback principle

จนจบ Phase 3 ระบบ MongoDB/Express/Render เดิมต้อง deploy ได้และเป็น source of truth. การ
migrate ไม่มีคำสั่งลบข้อมูล MongoDB หรือ Firestore. หากพบปัญหาให้หยุด traffic ใหม่และกลับไปใช้
Render revision ที่ทำงานล่าสุด โดยเก็บ Firestore ไว้สำหรับตรวจสอบเท่านั้น
