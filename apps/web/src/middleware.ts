import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Note: Next.js middleware cannot easily read localStorage because it runs on the server.
// For true Auth-Aware routing we would use cookies, but since this project is using 
// localStorage for token storage (client-side), we must rely on client-side route guards.
// This middleware is a placeholder if we switch to cookies, otherwise client components will handle it.

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
