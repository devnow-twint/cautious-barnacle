import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { savePageLoad, getConfig } from '@/lib/database';

function getRealIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

export async function GET(req) {
  const ip = getRealIP(req);
  const token = crypto.randomBytes(32).toString('hex');
  const delay = Math.floor(Math.random() * 6) + 10;

  try {
    await savePageLoad(ip, token);
    const maxLikesConfig = await getConfig('max_likes');
    const maxLikes = parseInt(maxLikesConfig) || 20;

    return NextResponse.json({ success: true, token, delay, maxLikes });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
