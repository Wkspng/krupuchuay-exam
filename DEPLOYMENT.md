# Deploy บน Render

เอกสารนี้ใช้ Render Web Service เป็นตัวอย่าง แอปต้องรันผ่าน HTTPS ใน production เพื่อให้ secure session cookie ทำงานได้ถูกต้อง

## 1. เตรียม repository

- Commit เฉพาะ source code, `package.json`, `package-lock.json`, `.env.example`, `README.md` และเอกสารนี้
- ห้าม commit `.env`, URI, password, JWT หรือ token ทุกชนิด
- ตรวจ `.gitignore` ก่อน push

## 2. สร้าง Web Service

1. สร้าง **Web Service** จาก repository บน Render
2. เลือก Node runtime และ branch ที่ต้องการ deploy
3. กำหนด Build Command: `npm install`
4. กำหนด Start Command: `npm start`
5. ตั้งค่า Environment Variables ใน Render dashboard เท่านั้น

ตัวแปรที่ต้องตั้ง:

| Variable | ค่า |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas URI ของ production database |
| `JWT_SECRET` | ค่าสุ่มยาวและเก็บเป็น secret |
| `SESSION_SECRET` | ค่าสุ่มยาวอีกชุดสำหรับ signed session |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | URL จริงของแอป เช่น `https://your-app.onrender.com` |
| `PORT` | ให้ใช้ค่าที่ Render กำหนด หรือ `5000` สำหรับผู้ให้บริการที่ต้องระบุ |

`SESSION_SECRET` ต้องเป็นค่าสุ่มยาวคนละค่ากับ `JWT_SECRET`; production server จะไม่เริ่มหากไม่มีค่านี้

ห้ามตั้ง `CORS_ORIGIN=*` ใน production และห้าม upload `.env` ไปยัง Render, GitHub หรือพื้นที่ public อื่น

## 3. ตั้งค่า MongoDB Atlas

- สร้าง database user เฉพาะ production และให้สิทธิ์เท่าที่จำเป็น (เช่น `readWrite` เฉพาะ database `krupuchuay`)
- ตั้ง Network Access ให้จำกัด IP ให้แคบที่สุดตามความสามารถของ hosting provider
- หากผู้ให้บริการใช้ outbound IP แบบเปลี่ยนแปลงได้ ให้ใช้ `0.0.0.0/0` เฉพาะเมื่อจำเป็นจริง ๆ พร้อมรหัสผ่านที่รัดกุมและสิทธิ์ database แบบ least privilege; ตรวจสอบตัวเลือก Static Outbound IP ก่อนเสมอ
- เปิด TLS ตามค่าเริ่มต้นของ Atlas และอย่าเผยแพร่ connection string

## 4. ตรวจหลัง deploy

1. เปิด `https://your-domain/api/health`
2. ทดสอบสมัครสมาชิก, login, อนุมัติผู้ใช้ และ logout
3. ทดสอบ user ทำชุดข้อสอบและตรวจประวัติของตัวเอง
4. ทดสอบ admin จัดการผู้ใช้/คลังข้อสอบ/ชุดข้อสอบ และ dashboard
5. ตรวจ browser console และ Render logs ว่าไม่มี secret หรือ stack trace หลุดออกมา

## 5. การหมุน secret

- เปลี่ยน MongoDB password ใน Atlas แล้วอัปเดต `MONGODB_URI` ใน Render
- เปลี่ยน `JWT_SECRET` หากสงสัยว่ารั่วไหล; token เดิมจะใช้งานไม่ได้หลัง deploy รอบใหม่
- Deploy ใหม่และทดสอบ health check ทุกครั้งหลังเปลี่ยนค่า
