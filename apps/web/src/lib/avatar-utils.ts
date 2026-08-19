export function resolveAvatarUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  
  // Clean up leading slash if any
  const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
  
  // Determine the base URL
  // If S3 public URL is configured, use it. Otherwise, assume local storage via the API origin.
  const s3BaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
  if (s3BaseUrl) {
    const base = s3BaseUrl.endsWith("/") ? s3BaseUrl : `${s3BaseUrl}/`;
    return `${base}${cleanUrl}`;
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`;
  
  // For local disk, URLs might be returned as 'storage/avatars/x.png' 
  // or just 'avatars/x.png'. Add the 'storage/' prefix if missing and needed.
  if (!cleanUrl.startsWith("storage/")) {
    return `${base}storage/${cleanUrl}`;
  }
  
  return `${base}${cleanUrl}`;
}
