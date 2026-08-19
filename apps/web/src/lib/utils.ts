import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function asArray<T>(x: any): T[] {
  return Array.isArray(x) ? x : [];
}


export function parseUserAgent(ua: string): string {
  if (!ua) return "Unknown Device";
  
  let browser = "Unknown Browser";
  let os = "Unknown OS";

  // Basic Browser Detection
  if (ua.indexOf("Firefox") > -1) browser = "Firefox";
  else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
  else if (ua.indexOf("Trident") > -1) browser = "IE";
  else if (ua.indexOf("Edge") > -1) browser = "Edge";
  else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Safari";

  // Basic OS Detection
  if (ua.indexOf("Windows") > -1) os = "Windows";
  else if (ua.indexOf("Mac") > -1) os = "MacOS";
  else if (ua.indexOf("Linux") > -1) os = "Linux";
  else if (ua.indexOf("Android") > -1) os = "Android";
  else if (ua.indexOf("like Mac") > -1) os = "iOS";

  if (browser === "Unknown Browser" && os === "Unknown OS") {
      return ua; // fallback
  }

  return `${browser} on ${os}`;
}

export function resolveAvatarUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const prefix = `${supabaseUrl}/storage/v1/object/public/g4k`;
    const path = url.startsWith('/') ? url : `/${url}`;
    return `${prefix}${path}`;
  }

  let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (apiBaseUrl.endsWith("/api")) {
    apiBaseUrl = apiBaseUrl.replace(/\/api$/, "");
  }
  
  const prefix = apiBaseUrl.replace(/\/$/, "");
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${prefix}${path}`;
}
