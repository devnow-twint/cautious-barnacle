import { NextResponse } from 'next/server';

// Blocked User-Agent patterns (bots, scripts, scrapers)
const BLOCKED_UA_PATTERNS = [
  /axios/i,
  /python-requests/i,
  /curl/i,
  /wget/i,
  /java\//i,
  /go-http-client/i,
  /httpie/i,
  /insomnia/i,
  /postman/i,
];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Only protect /api/* routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const ua = request.headers.get('user-agent') || '';
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';

  // Block known bot/script User-Agents
  const isBlockedUA = BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua));
  if (isBlockedUA) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Block requests with no User-Agent at all (raw script)  
  if (!ua || ua.length < 10) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Block if no Origin AND no Referer (direct script call, not from browser)
  const hasOrigin = origin.length > 0;
  const hasReferer = referer.length > 0;
  if (!hasOrigin && !hasReferer) {
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
