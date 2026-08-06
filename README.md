# 🌊 Prompty — Code & AI Prompt Sharing Platform

**Prompty** คือแพลตฟอร์มสำหรับแบ่งปันและค้นหา **Code Snippets** และ **AI Prompts** ครบวงจร พร้อมระบบคัดลอกด้วยคลิกเดียว ระบบจัดอันดับครีเอเตอร์ และแผงควบคุมผู้ดูแลระบบ (Admin Panel) เต็มรูปแบบ

---

## ✨ ฟีเจอร์หลัก (Features)

### 👥 ฝั่งผู้ใช้งานทั่วไป (User App)
- 📝 **แบ่งปัน Code & Prompt**: รองรับการแชร์โค้ดหลายภาษา และ AI Prompts (พร้อมระบุ AI Model และ Parameters)
- 📋 **คัดลอกคลิกเดียว (One-click Copy)**: พร้อมนับจำนวนการคัดลอก (Copy Milestone)
- 👍 **ระบบโหวต (Vote System)**: UP / DOWN Vote คำนวณคะแนนคะแนน Real-time
- 🔖 **ระบบบุ๊กมาร์ก & คอลเลกชัน (Bookmarks & Collections)**: บันทึกโพสต์ไว้ดูภายหลังและจัดกลุ่มตามต้องการ
- 🏆 **ตารางอันดับครีเอเตอร์ (Leaderboard)**: อันดับผู้มีส่วนร่วมสูงสุด (Top Contributors) รายสัปดาห์ / รายเดือน / ทั้งหมด (คัดแยกบัญชี Admin ออกจากอันดับ)
- 🔍 **ระบบค้นหาอัจฉริยะ (Smart Search)**: ค้นหาโพสต์ ผู้ใช้ และแท็ก พร้อม Autocomplete Dropdown
- 🔔 **ระบบแจ้งเตือน (Notifications)**: แจ้งเตือนคอมเมนต์ โหวต การติดตาม และสถิติคัดลอก
- 📧 **ระบบล็อกอิน & OTP**: สมัครสมาชิก ล็อกอิน และยืนยันตัวตนผ่านอีเมลด้วย OTP 6 หลัก

### 👑 ฝั่งผู้ดูแลระบบ (Admin Panel)
- 📊 **ภาพรวมสถิติ (Dashboard Overview)**: สถิติผู้ใช้ โพสต์ รายงานปัญหา พร้อมกราฟโพสต์ใหม่ย้อนหลัง 30 วัน
- 📝 **จัดการโพสต์ (Manage Posts)**: ตารางค้นหา กรองประเภทโพสต์ กรองวันที่ และลบโพสต์ด้วย Confirmation Modal
- 🚩 **จัดการโพสต์ที่ถูกรายงาน (Reported Posts)**: ตารางรายงานปัญหา พร้อมปุ่มละเว้น (Safe) และปุ่มลบโพสต์ (Resolve)
- 👥 **จัดการผู้ใช้งาน (Manage Users)**: สลับสิทธิ์ (User/Admin), ระงับบัญชี (Active/Banned), เพิ่ม Admin ใหม่ และลบบัญชีถาวรพร้อม Cascade Deletion
- 🏷️ **จัดการแท็ก (Manage Tags)**: เพิ่ม/แก้ไขแท็ก และสลับสถานะเปิด/ซ่อน (`VISIBLE` / `HIDDEN`)
- ⚙️ **ตั้งค่าระบบ (System Settings)**: เปลี่ยนอีเมล/รหัสผ่าน Admin และสวิตช์เปิด/ปิด **Maintenance Mode** & **Auto-Hide Reports**

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Library**: React 19, Vanilla CSS (Design Tokens System), Lucide Icons
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase) + [Prisma ORM v7](https://www.prisma.io/)
- **Authentication**: NextAuth.js (Auth.js v5) + bcryptjs
- **Email Service**: Nodemailer (Gmail SMTP)

---

## 🚀 ขั้นตอนการติดตั้งและเริ่มใช้งาน (Getting Started)

สำหรับผู้ที่ Clone โปรเจกต์ไปรันบนเครื่องคอมพิวเตอร์ของคุณ ให้ทำตามขั้นตอนดังนี้:

### 1. Clone Repository & เข้าโฟลเดอร์โปรเจกต์
```bash
git clone <REPOSITORY_URL>
cd prompty
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่าไฟล์ `.env`
สร้างไฟล์ชื่อ `.env` ในโฟลเดอร์หลักของโปรเจกต์ (`/prompty/.env`) แล้วคัดลอกข้อความด้านล่างนี้ไปวาง:

```env
# Supabase PostgreSQL Connection
DATABASE_URL="postgresql://postgres.onylstnwvwelflttrlsr:PROMPTY%40mikk0228@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.onylstnwvwelflttrlsr:PROMPTY%40mikk0228@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="super-secret-prompty-auth-key-2024"

# Gmail SMTP Configuration for sending OTPs
EMAIL_USER="promptyez@gmail.com"
EMAIL_PASS="xyrhmqbhiozibjzh"

# Supabase Storage (Server & Client)
NEXT_PUBLIC_SUPABASE_URL="https://onylstnwvwelflttrlsr.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWxzdG53dndlbGZsdHRybHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM1MTczMTMsImV4cCI6MjA5OTA5MzMxM30.H5aoBXzMqCqkZiobZwBrGIb5TYBgvf3_DD-hB5kbsSc"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ueWxzdG53dndlbGZsdHRybHNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUxNzMxMywiZXhwIjoyMDk5MDkzMzEzfQ.QE-JUfDtJAYBMqK9FQSF1QNkkfonHW944zX8TSGXWCc"
```

### 4. สร้าง Prisma Client
```bash
npx prisma generate
```

### 5. สตาร์ต Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์แล้วเข้าไปที่ [http://localhost:3000](http://localhost:3000) 🎉

---

## 🔑 บัญชีสำหรับทดสอบ (Test Accounts)

- ** Admin Dashboard**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- ** User App**: [http://localhost:3000/login](http://localhost:3000/login)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
prompty/
├── prisma/
│   └── schema.prisma         # Prisma Database Schema & Models
├── src/
│   ├── app/                  # Next.js App Router (Pages, Layouts & APIs)
│   │   ├── (auth)/           # Authentication pages (login, register, reset)
│   │   ├── admin/            # Admin Panel Dashboard routes
│   │   ├── leaderboard/      # Leaderboard page
│   │   ├── profile/          # User profile pages
│   │   └── search/           # Search results page
│   ├── components/           # UI Components
│   │   ├── admin/            # Admin Modals, Dropdowns, Sidebar, Topbar
│   │   ├── feed/             # Feed Post Cards, Filters, Modals
│   │   ├── layout/           # Main Navbar, Footer
│   │   └── shared/           # Logo, Badges, Common Components
│   ├── lib/
│   │   ├── actions/          # Server Actions (DB Queries & Business Logic)
│   │   └── prisma.ts         # Prisma Client Singleton & Proxy
│   └── proxy.ts              # Next.js Edge Middleware Protection Guard
├── .env                      # Environment Variables Config
└── README.md                 # Project Documentation
```

---

## 📜 คำสั่งที่สำคัญ (Available Scripts)

- `npm run dev`: สตาร์ตโหมดพัฒนา (Development Mode)
- `npx tsc --noEmit`: ตรวจสอบความถูกต้องของประเภทข้อมูล TypeScript
- `npx prisma db push`: อัปเดตโครงสร้างฐานข้อมูลตาม `schema.prisma`
- `npx prisma generate`: สร้าง TypeScript Client สำหรับ Prisma

---

© 2026 Prompty Platform. All Rights Reserved.
