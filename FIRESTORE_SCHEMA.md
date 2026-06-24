# Firestore schema (Phase 1)

สถานะ: schema นี้ใช้สำหรับเตรียม migration จาก MongoDB Atlas เท่านั้น ระบบ production
ปัจจุบันยังอ่านและเขียน MongoDB ผ่าน Express/JWT เดิมอยู่

เอกสารทุก field วันที่ใช้ Firestore `Timestamp` (Admin SDK รับ JavaScript `Date` แล้วแปลงให้)
และทุก record ที่ migrate จะมี `legacyMongoId` เป็น string เพื่อให้ตรวจสอบต้นทางและรัน script
ซ้ำได้โดยไม่สร้างข้อมูลซ้ำ

## `users/{uid}`

ใน Phase 1 ที่ยังไม่มี Firebase Auth, `{uid}` และ field `uid` ใช้ MongoDB `_id` เดิมชั่วคราว.
Phase 2 จะผูก profile เข้ากับ Firebase Auth UID โดยไม่ย้าย `password` หรือ `passwordHash` ไป
Firestore.

| Field | รายละเอียด |
| --- | --- |
| `uid` | Firebase Auth UID ในอนาคต; Phase 1 ใช้ legacy Mongo ID ชั่วคราว |
| `email`, `name` | ข้อมูลโปรไฟล์ |
| `role` | `user` หรือ `admin` |
| `approvalStatus` | `pending`, `approved`, `rejected` |
| `isApproved` | ค่า compatibility ที่อนุมานจาก approval status |
| `plan` | `free`, `yearly`, `lifetime` |
| `lifetimeAccess`, `subscriptionExpiresAt` | สิทธิ์สมาชิก |
| `legacyMongoId`, `legacyUsername` | ข้อมูลอ้างอิง MongoDB เดิม |
| `createdAt`, `updatedAt` | เวลาเอกสาร |

## `categories/{categoryId}`

`name`, `description`, `order`, `isActive`, `legacyMongoId`, `createdAt`, `updatedAt`

## `questions/{questionId}`

`categoryId`, `categoryName`, `questionText`, `choices`, `correctAnswerIndex`, `explanation`,
`difficulty`, `source`, `isActive`, `legacyMongoId`, `createdAt`, `updatedAt`

## `examSets/{examSetId}`

`title`, `description`, `mode`, `totalQuestions`, `timeLimitMinutes`, `passingScorePercent`,
`isActive`, `categoryRules`, `randomizeQuestions`, `randomizeChoices`,
`showExplanationAfterSubmit`, `legacyMongoId`, `createdAt`, `updatedAt`

Migration จะเก็บ `createdBy` เพิ่มเติมเมื่อ MongoDB เดิมมีค่า เพื่อรักษาความสัมพันธ์สำหรับ
เครื่องมือ admin ในอนาคต

## `examAttempts/{attemptId}`

`userId`, `userEmail`, `userName`, `categoryId`, `categoryName`, `examSetId`, `examSetTitle`,
`totalQuestions`, `correctCount`, `scorePercent`, `passed`, `durationSeconds`, `answers`,
`startedAt`, `submittedAt`, `legacyMongoId`, `createdAt`, `updatedAt`

## `statsDaily/{date}`

สงวนไว้สำหรับ aggregate รายวัน เช่น จำนวน attempt, จำนวนผู้ใช้ active และคะแนนเฉลี่ย.
Phase 1 ยังไม่สร้าง aggregate จากข้อมูลเดิมอัตโนมัติ

## `appSettings/main`

สงวนสำหรับ setting ระดับแอป เช่น feature flags, เวอร์ชัน schema และค่าที่ไม่ใช่ secret.
ห้ามบันทึก credentials, password หรือ secret ในเอกสารนี้

## ความสัมพันธ์และข้อควรระวัง

- Document IDs จาก migration ใช้ legacy Mongo ObjectId แบบ string จึงอ้างอิงกันได้โดยตรง
- `answers` ของ attempt แปลง ObjectId และ Date ที่ซ้อนอยู่เป็นค่า Firestore ที่ปลอดภัย
- Firestore ไม่ใช้ password hash ใน user profile; การย้ายบัญชีไป Firebase Auth เป็น Phase 2
- `statsDaily` และ `appSettings/main` มี schema พร้อมใช้ แต่ไม่ถูกเขียนโดย migration รอบนี้
