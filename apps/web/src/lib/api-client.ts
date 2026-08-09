import { useAuthStore } from "./auth-store";

const API_BASE_URL = "/api";

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers || {});
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Ensure cookies (like g4k_refresh_token) are passed
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 404 || response.status >= 500) {
      // Global Interceptor: Clear auth state and force redirect to login on fatal server errors or unauthorized
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Session expired or server unreachable. Please log in again.");
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
