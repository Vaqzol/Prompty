import { NextRequest } from 'next/server';
import { aiRequest } from '@/lib/ai-request';
export const maxDuration = 60;
export async function POST(request: NextRequest) { return aiRequest(request, 'enhance'); }
