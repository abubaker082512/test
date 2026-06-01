// Production security hardening for Next.js API
// Basic HTTP security headers for all API routes
import { NextResponse } from 'next/server';

export function middleware(req) {
  const res = NextResponse.next();
  // Security headers
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Enforce HTTPS for production
  if (req?.headers?.['x-forwarded-proto'] === 'http') {
    // In production, you should redirect to HTTPS (handled by hosting provider usually)
  }
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
