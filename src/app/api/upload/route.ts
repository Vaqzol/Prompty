import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ใช้ service_role key ฝั่ง server เท่านั้น — ข้าม RLS ได้, ไม่เปิดเผยไปหน้าเว็บ
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'post-images';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'ไฟล์ใหญ่เกินไป (สูงสุด 10MB)' }, { status: 400 });
    }

    // สร้างชื่อไฟล์ unique
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return NextResponse.json({ error: 'อัปโหลดไม่สำเร็จ: ' + error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ' }, { status: 500 });
  }
}
