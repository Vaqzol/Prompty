import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { requireSession, AccessError } from './session';
import { rateLimit, RateLimitError } from './rate-limit';

export function imageKind(bytes: Uint8Array): {ext: string; mime: string} | null {
  const b = Buffer.from(bytes);
  if (b.length >= 12 && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return {ext:'png',mime:'image/png'};
  if (b.length >= 4 && b[0] === 255 && b[1] === 216 && b[2] === 255) return {ext:'jpg',mime:'image/jpeg'};
  if (b.length >= 12 && ['GIF87a','GIF89a'].includes(b.toString('ascii',0,6))) return {ext:'gif',mime:'image/gif'};
  if (b.length >= 12 && b.toString('ascii',0,4) === 'RIFF' && b.toString('ascii',8,12) === 'WEBP') return {ext:'webp',mime:'image/webp'};
  return null;
}

export async function uploadImage(request: NextRequest, bucket: 'avatars' | 'post-images', maxBytes: number) {
  try {
    const session = await requireSession();
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) throw new AccessError('คำขอไม่ถูกต้อง', 403);
    await rateLimit('upload', session.user.id, 10, 60);
    if (Number(request.headers.get('content-length') || 0) > maxBytes + 65536) return NextResponse.json({error:'ไฟล์ใหญ่เกินไป'}, {status:413});
    const data = await request.formData();
    const file = data.get('file');
    if (!(file instanceof File) || !file.size) return NextResponse.json({error:'กรุณาเลือกไฟล์รูปภาพ'}, {status:400});
    if (file.size > maxBytes) return NextResponse.json({error:'ไฟล์ใหญ่เกินไป'}, {status:413});
    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = imageKind(bytes);
    if (!kind || (file.type && file.type !== kind.mime)) return NextResponse.json({error:'รองรับเฉพาะรูป PNG, JPEG, GIF และ WebP'}, {status:400});
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const filename = session.user.id + '/' + randomUUID() + '.' + kind.ext;
    const {error} = await supabase.storage.from(bucket).upload(filename, bytes, {contentType:kind.mime, upsert:false});
    if (error) return NextResponse.json({error:'อัปโหลดไม่สำเร็จ กรุณาลองใหม่'}, {status:500});
    const {data: result} = supabase.storage.from(bucket).getPublicUrl(filename);
    return NextResponse.json({url:result.publicUrl});
  } catch (error) {
    if (error instanceof RateLimitError) return NextResponse.json({error:error.message}, {status:429,headers:{'Retry-After':String(error.retryAfter)}});
    if (error instanceof AccessError) return NextResponse.json({error:error.message}, {status:error.status});
    return NextResponse.json({error:'ไม่สามารถอัปโหลดได้ กรุณาลองใหม่'}, {status:500});
  }
}
