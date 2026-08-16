import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED: Record<string, string> = {
  "/dashboard/org/users": "users.employee.manage",
  "/dashboard/org/attendance": "hr.view-team-attendance",
  "/dashboard/org/leave": "leave.approve-employee",
  "/dashboard/org/departments": "departments.manage",
  "/dashboard/org/designations": "designations.manage",
  "/dashboard/settings": "settings.manage",
  "/dashboard/audit": "audit.view",
  "/dashboard/admin/attendance": "admin.view-all-attendance",
  "/dashboard/admin/reports": "reports.manage",
  "/dashboard/reports": "reports.view",
};

export function proxy(req: NextRequest) {
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
    const raw = req.cookies.get("g4k_capabilities")?.value;
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
  
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/login", "/forgot-password", "/reset-password", "/onboarding", "/role-select", "/change-password"] };
