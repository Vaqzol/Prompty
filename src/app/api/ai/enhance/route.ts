import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { enhancePrompt } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อน' }, { status: 401 });
    }

    const { content, type } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกเนื้อหาก่อน' }, { status: 400 });
    }

    if (!type || !['CODE', 'PROMPT'].includes(type)) {
      return NextResponse.json({ error: 'ประเภทไม่ถูกต้อง' }, { status: 400 });
    }

    const enhancedContent = await enhancePrompt(content.trim(), type);

    return NextResponse.json({ enhancedContent });
  } catch (error) {
    console.error('AI enhance error:', error);

    // Handle rate limit
    const message = error instanceof Error ? error.message : '';
    if (message.includes('429') || message.includes('RATE_LIMIT')) {
      return NextResponse.json(
        { error: 'AI ถูกใช้งานบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'AI ไม่สามารถประมวลผลได้ กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}
