import { NextRequest } from 'next/server';
import { aiRequest } from '@/lib/ai-request';
export async function POST(request: NextRequest) { return aiRequest(request, 'enhance'); }
