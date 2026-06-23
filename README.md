# Krupuchuay Exam

แอปข้อสอบครูผู้ช่วย ภาค ก. พร้อมระบบสมัครสมาชิก/อนุมัติผู้ใช้, คลังข้อสอบ, ชุดข้อสอบโหมดสอบจริง และประวัติผลสอบบน MongoDB Atlas

## ติดตั้ง

```powershell
cd "C:\Users\hp it\krupuchuay-exam"
npm install
Copy-Item .env.example .env
```

แก้ไข `.env` เฉพาะบนเครื่องหรือในหน้าตั้งค่า Environment Variables ของผู้ให้บริการ deploy ห้าม commit หรืออัปโหลดไฟล์นี้ขึ้น public repository

ตัวแปรที่ต้องมี:

```env
MONGODB_URI="<MongoDB Atlas connection string>"
PORT=5000
JWT_SECRET="<long random secret>"
SESSION_SECRET="<different long random session secret>"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5000"
```

## Seed ข้อมูล

```powershell
npm run seed
npm run seed:examsets
```

`seed:examsets` สร้างชุดข้อสอบจำลอง 50 ข้อจากข้อสอบตัวอย่างในคลัง โดยไม่ลบข้อมูลเดิม

## สร้างและอนุมัติ Admin

```powershell
npm run create-admin -- --name "Admin" --email "admin@example.com" --password "<choose-a-strong-password>"
npm run approve-user -- --email "user@example.com"
```

อย่านำรหัสผ่านจริงใส่ใน source code, documentation ที่เผยแพร่ หรือ command history ที่แชร์ต่อ

## รันบนเครื่อง

```powershell
npm run dev
```

เปิด `http://localhost:5000` และตรวจ health check ที่ `http://localhost:5000/api/health` ให้ตรงกับค่า `CORS_ORIGIN` ใน `.env`

สำหรับการรัน production-like บนเครื่อง:

```powershell
$env:NODE_ENV="production"
$env:JWT_SECRET="<long-random-secret>"
$env:CORS_ORIGIN="https://your-domain.example"
npm start
```

## วิธีใช้งานระบบ

- ผู้สมัครใหม่จะอยู่สถานะ `pending`; Admin อนุมัติจากเมนูจัดการผู้ใช้
- Admin จัดการหมวด, ข้อสอบ, import/export JSON และชุดข้อสอบได้
- ผู้ใช้เลือกหมวดหรือชุดข้อสอบ active เพื่อฝึกทำ/สอบจริง
- ผลสอบถูกบันทึกในประวัติและสถิติ โดยผู้ใช้เห็นเฉพาะข้อมูลของตนเอง

## Deploy เบื้องต้น

ดูขั้นตอนสำหรับ Render ได้ที่ [DEPLOYMENT.md](DEPLOYMENT.md)

ก่อนเปิดระบบจริง ให้เปลี่ยนรหัสผ่าน MongoDB Atlas และตั้ง `JWT_SECRET` เป็นค่าสุ่มยาวที่ไม่ซ้ำกับ development ทันที หากมีการรั่วไหล ให้หมุนทั้ง MongoDB password และ JWT secret; การเปลี่ยน JWT secret จะทำให้ token เดิมหมดอายุโดยปริยาย
