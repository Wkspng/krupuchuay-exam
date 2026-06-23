# Firebase Hosting + Cloud Run migration

## เป้าหมายการย้ายระบบ

ระยะที่ 1 ย้ายหน้าเว็บไป Firebase Hosting และรัน Express API บน Cloud Run ที่
`asia-southeast1` โดยยังใช้ MongoDB Atlas เดิม ไม่มีการย้ายหรือลบข้อมูลฐานข้อมูล
การย้ายนี้เป็นแบบเพิ่มช่องทาง deploy ใหม่ จึงคง Render และ `render.yaml` ไว้สำหรับ
rollback ได้ตลอดเวลา

## โครงสร้างใหม่

```
Browser
  -> Firebase Hosting (public/)
       -> /api/** rewrite -> Cloud Run: krupuchuay-exam-api
                                  -> MongoDB Atlas: krupuchuay
```

Firebase Hosting ส่งคำขอ `/api/**` ไปยัง Cloud Run ใน project เดียวกัน ส่วน route อื่น
ให้บริการไฟล์หน้าเว็บจาก `public/` ตาม `firebase.json`.

## สิ่งที่ยังไม่ย้าย

- MongoDB Atlas ยังเป็นฐานข้อมูลหลัก (ไม่ย้ายไป Firestore)
- ระบบ Login/Register/JWT เดิมยังใช้งานอยู่ (ไม่ย้ายไป Firebase Auth)
- Render ยังคง deploy และใช้งานได้ตามเดิม

## ติดตั้งและเข้าสู่ระบบ CLI

ติดตั้ง Node.js 20, Google Cloud CLI และ Firebase CLI แล้วเข้าสู่ระบบ:

```powershell
npm install -g firebase-tools
firebase login
gcloud auth login
```

## สร้าง Firebase / Google Cloud project

1. สร้าง project จาก [Firebase Console](https://console.firebase.google.com/) หรือใช้ project Google Cloud ที่มีอยู่
2. จดค่า `<PROJECT_ID>` โดยไม่ต้องใส่ใน source code
3. เลือก project ใน CLI และเปิดใช้บริการที่จำเป็น:

```powershell
gcloud config set project <PROJECT_ID>
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com
firebase use <PROJECT_ID>
```

หากต้องการเก็บการเลือก project ไว้ในเครื่อง ให้คัดลอก `.firebaserc.example` เป็น
`.firebaserc` แล้วแทน placeholder ด้วย project ID ของคุณ โดย `.firebaserc` ไม่จำเป็นต้อง
มีข้อมูลลับและสามารถเลือกไม่ commit ได้

## ตั้งค่า secrets และ environment variables สำหรับ Cloud Run

ห้าม upload ไฟล์ `.env` หรือ commit ค่า secret ใด ๆ ขึ้น Git. แนะนำให้สร้าง secrets ใน
Google Secret Manager แล้วให้ Cloud Run service account มีบทบาท
`roles/secretmanager.secretAccessor` สำหรับแต่ละ secret:

- `MONGODB_URI`
- `JWT_SECRET`
- `SESSION_SECRET`

ตั้งค่า runtime environment variables ดังนี้ (ไม่ใส่ค่าจริงในเอกสารหรือ Git):

- `NODE_ENV=production`
- `CORS_ORIGIN=https://<PROJECT_ID>.web.app,https://<PROJECT_ID>.firebaseapp.com`
- `MONGODB_URI` จาก Secret Manager
- `JWT_SECRET` จาก Secret Manager
- `SESSION_SECRET` จาก Secret Manager

Cloud Run กำหนด `PORT` ให้ container เอง จึงไม่ต้องตั้งค่าเองใน Console; server อ่านจาก
`process.env.PORT` และ bind ที่ `0.0.0.0`. หากระบบจัดการ environment แสดง `PORT` ให้ปล่อย
เป็นค่าที่ Cloud Run กำหนดเท่านั้น

เมื่อเพิ่ม custom domain ภายหลัง ให้ต่อท้าย origin ลงใน `CORS_ORIGIN` ด้วย comma เช่น
`https://example.com` ห้ามใช้ `*` ใน production.

## Deploy Cloud Run

จาก root ของ repository ให้ deploy image จาก source ได้ด้วยคำสั่ง Windows Command Prompt:

```bat
gcloud run deploy krupuchuay-exam-api ^
--source . ^
--region asia-southeast1 ^
--allow-unauthenticated ^
--set-env-vars NODE_ENV=production,CORS_ORIGIN=https://<PROJECT_ID>.web.app ^
--set-secrets MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest,SESSION_SECRET=SESSION_SECRET:latest
```

`--allow-unauthenticated` จำเป็นเพื่อให้ Firebase Hosting rewrite เรียก API ได้; การป้องกัน
ข้อมูลยังคงใช้ JWT และสิทธิ์ admin ของแอปตามเดิม. หากไม่ใช้ Secret Manager ให้ใส่ค่า
environment variables ผ่าน Google Cloud Console ของ Cloud Run แทน โดยห้ามบันทึกลง Git หรือ
Dockerfile.

หลัง deploy หากจะให้ผู้ใช้เข้าโดเมน `firebaseapp.com` ด้วย ให้แก้ค่า `CORS_ORIGIN` ใน Cloud
Run Console เป็นรายการสอง domain ตามหัวข้อ CORS ด้านล่าง (หรือใช้ custom delimiter ของ
`gcloud` เพื่อส่งค่าที่มี comma). การใช้ค่า web.app เพียงโดเมนเดียวในคำสั่งแรกช่วยเลี่ยงการ
ตีความ comma เป็นตัวคั่นของ `--set-env-vars`.

หลัง deploy ตรวจสอบ `https://<CLOUD_RUN_URL>/api/health` และดู log โดยไม่คัดลอกค่า
environment variables ออกมา.

## Deploy Firebase Hosting

ตรวจ `firebase.json` ว่าใช้ service ID และ region เดียวกับ Cloud Run แล้ว deploy:

```powershell
firebase login
firebase use <PROJECT_ID>
firebase deploy --only hosting
```

ตรวจทั้ง `https://<PROJECT_ID>.web.app/` และ
`https://<PROJECT_ID>.web.app/api/health`. หน้าเว็บจะเรียก `/api/**` ผ่าน Firebase Hosting
จึงไม่ต้อง hardcode URL ของ Cloud Run ใน frontend.

## CORS

ค่า `CORS_ORIGIN` รับหลาย origin โดยคั่นด้วย comma. สำหรับ Firebase Hosting ใช้ทั้ง:

```
https://<PROJECT_ID>.web.app,https://<PROJECT_ID>.firebaseapp.com
```

เพิ่ม custom domain ที่อนุมัติแล้วเท่านั้น และห้ามตั้ง wildcard origin ใน production.

## Rollback กลับ Render

Render ไม่ถูกแก้ไขในการย้ายนี้: `render.yaml`, scripts และ Express server เดิมยังอยู่ครบ.
หากต้อง rollback ให้หยุดใช้ URL Firebase/เปลี่ยน DNS กลับไป Render และ deploy revision ล่าสุด
ของ Render ตามปกติ โดยไม่ต้องลบ Cloud Run, Firebase Hosting หรือ MongoDB data. ควรเก็บ
Render environment variables เดิมไว้จนกว่าจะทดสอบ Firebase/Cloud Run ผ่านครบถ้วน.
