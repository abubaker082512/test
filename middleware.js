// Production security hardening and routing for Next.js API & SoftAggregator Callback
import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // SoftAggregator seamless callback rewrite: /sg/callback -> /api/softaggregator/callback
  if (pathname.startsWith('/sg/callback') || pathname === '/sg/callback') {
    const url = req.nextUrl.clone();
    url.pathname = '/api/softaggregator/callback';
    const res = NextResponse.rewrite(url);
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Signature');
    return res;
  }

  // Seamless URL rewrite: route /gold_api directly to /api/gold_api
  if (pathname.startsWith('/gold_api')) {
    const url = req.nextUrl.clone();
    url.pathname = '/api' + pathname;
    const res = NextResponse.rewrite(url);
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res;
  }

  const res = NextResponse.next();
  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return res;
}

export const config = {
  matcher: ['/api/:path*', '/gold_api', '/gold_api/:path*', '/sg/callback', '/sg/:path*'],
};
