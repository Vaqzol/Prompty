import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { requireSession, AccessError } from './session';
import { rateLimit, RateLimitError } from './rate-limit';
import { enhancePrompt, suggestTags } from './gemini';

export async function aiRequest(request: NextRequest, mode: 'enhance' | 'tags') {
  try {
    const session = await requireSession();
    const origin = request.headers.get('origin');
    if (origin && origin !== request.nextUrl.origin) throw new AccessError('คำขอไม่ถูกต้อง',403);
    if (Number(request.headers.get('content-length') || 0) > 65536) throw new AccessError('เนื้อหายาวเกินไป',413);
    const body = await request.json();
    const {content = '', title = '', type} = body ?? {};
    if (typeof content !== 'string' || typeof title !== 'string' || !['CODE','PROMPT'].includes(type)) throw new AccessError('ข้อมูลไม่ถูกต้อง',400);
    if (content.length > 12000 || title.length > 200) throw new AccessError('เนื้อหายาวเกินไป (สูงสุด 12,000 ตัวอักษร)',400);
    if (mode === 'enhance' ? !content.trim() : !content.trim() && !title.trim()) throw new AccessError('กรุณากรอกเนื้อหาก่อน',400);
    await rateLimit('ai-minute',session.user.id,5,60);
    await rateLimit('ai-day',session.user.id,40,86400);
    if (mode === 'enhance') return NextResponse.json({enhancedContent:await enhancePrompt(content.trim(),type)});
    return NextResponse.json({tags:await suggestTags(title.trim(),content.trim(),type)});
  } catch(error) {
    if (error instanceof AccessError) return NextResponse.json({error:error.message},{status:error.status});
    if (error instanceof RateLimitError) return NextResponse.json({error:error.message,retryAfter:error.retryAfter},{status:429,headers:{'Retry-After':String(error.retryAfter)}});
    const message = error instanceof Error ? error.message : '';
    if (/429|RATE_LIMIT|RESOURCE_EXHAUSTED/.test(message)) return NextResponse.json({error:'โควตา AI อาจหมด กรุณาลองภายหลัง คุณยังสร้างโพสต์ได้โดยไม่ใช้ AI'},{status:429});
    if (message === 'AI_OUTPUT_TRUNCATED') return NextResponse.json({error:'ผลลัพธ์ AI ยาวเกินขีดจำกัด กรุณาลดขนาดเนื้อหาแล้วลองใหม่'},{status:422});
    return NextResponse.json({error:'AI ไม่สามารถประมวลผลได้ กรุณาลองใหม่ภายหลัง'},{status:500});
  }
}
