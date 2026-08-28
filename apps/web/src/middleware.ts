import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED: Record<string, string> = {
  "/dashboard/settings": "settings.manage",
  "/dashboard/audit": "audit.view",
  "/dashboard/reports": "reports.view",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  const isAuthRoute = 
    pathname.startsWith("/login") || 
    pathname.startsWith("/forgot-password") || 
    pathname.startsWith("/reset-password");

  const token = req.cookies.get("g4k_token")?.value;

  // If user is accessing an auth route but already has a token, send them to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const isProtectedSessionRoute =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/role-select") ||
    pathname.startsWith("/change-password");

  if (isProtectedSessionRoute && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Only intercept /dashboard paths from here on
  if (!pathname.startsWith("/dashboard")) return NextResponse.next();
  
  // Verify auth cookie for dashboard routes
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  
  // Check if route is protected
  const required = Object.entries(PROTECTED).find(([r]) => pathname.startsWith(r))?.[1];
  
  if (required) {
    const capCookie = req.cookies.getAll().find(c => c.name.startsWith("g4k_capabilities_"));
    const raw = capCookie?.value;
    let caps: string[] = [];
    try { 
      caps = raw ? JSON.parse(decodeURIComponent(raw)) : []; 
    } catch {}
    
    const ok = caps.includes("*") || caps.includes(required);
    
    if (!ok) {
      // Redirect back to main dashboard with an error flag
      return NextResponse.redirect(new URL("/dashboard?error=unauthorized", req.url));
    }
  }

  // Apply CSP headers
  const response = NextResponse.next();
  const cspHeader = `
    default-src 'self';
    script-src 'self' ${process.env.NODE_ENV !== 'production' ? "'unsafe-eval'" : ""} 'unsafe-inline';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https: wss:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  // Trade-off: g4k_token is stored in a JS-readable cookie to support client-side 
  // API requests. This widens the XSS blast radius but is required for current architecture.
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/forgot-password", "/reset-password", "/onboarding", "/role-select", "/change-password"] };
