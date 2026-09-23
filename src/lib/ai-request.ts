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
    const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number' ? error.status : undefined;
    // Never log provider messages: SDK errors may contain URLs, keys or prompt text.
    console.error('AI request failed', { mode, providerStatus: status,
      reason: ['AI_OUTPUT_TRUNCATED','AI_EMPTY_OUTPUT','AI_BLOCKED_OUTPUT'].includes(message) ? message : 'REQUEST_FAILED' });
    if (message === 'GEMINI_API_KEY is not configured' || status === 400 || status === 401 || status === 403 || status === 404) return NextResponse.json({error:'บริการ AI ยังตั้งค่าไม่สมบูรณ์ กรุณาแจ้งผู้ดูแลระบบ คุณยังโพสต์ได้โดยไม่ใช้ AI'},{status:503});
    if (message === 'AI_BLOCKED_OUTPUT') return NextResponse.json({error:'AI ไม่สามารถตอบเนื้อหานี้ได้ กรุณาปรับข้อความแล้วลองใหม่'},{status:422});
    if (status === 503 || status === 504) return NextResponse.json({error:'บริการ AI ไม่พร้อมใช้งานชั่วคราว กรุณาลองใหม่ภายหลัง'},{status:503});
    if (error instanceof Error && /abort|timeout/i.test(error.name)) return NextResponse.json({error:'AI ใช้เวลาตอบนานเกินไป กรุณาลองใหม่'},{status:504});
    if (message === 'AI_EMPTY_OUTPUT') return NextResponse.json({error:'AI ส่งคำตอบว่างกลับมา กรุณาลองใหม่'},{status:502});
    if (status === 429 || /429|RATE_LIMIT|RESOURCE_EXHAUSTED/.test(message)) return NextResponse.json({error:'โควตา AI อาจหมด กรุณาลองภายหลัง คุณยังสร้างโพสต์ได้โดยไม่ใช้ AI'},{status:429});
    if (message === 'AI_OUTPUT_TRUNCATED') return NextResponse.json({error:'ผลลัพธ์ AI ยาวเกินขีดจำกัด กรุณาลดขนาดเนื้อหาแล้วลองใหม่'},{status:422});
    return NextResponse.json({error:'AI ไม่สามารถประมวลผลได้ กรุณาลองใหม่ภายหลัง'},{status:500});
  }
}
