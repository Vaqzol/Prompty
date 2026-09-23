import { NextRequest } from 'next/server';
import { uploadImage } from '@/lib/upload';
export async function POST(request: NextRequest) { return uploadImage(request, 'avatars', 5 * 1024 * 1024); }
