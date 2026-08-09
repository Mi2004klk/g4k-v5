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
    // Auth endpoints (login/forgot/reset) own their 401 handling — never intercept.
    // A 401 on these means "invalid credentials", not "expired session".
    const isAuthEndpoint =
      endpoint.includes("/auth/login") ||
      endpoint.includes("/auth/forgot-password") ||
      endpoint.includes("/auth/reset-password") ||
      endpoint.includes("/auth/refresh");

    if (response.status === 401 && !isAuthEndpoint) {
      // Session may have expired — attempt ONE silent refresh via the HttpOnly cookie.
      try {
        const refreshUrl = `${API_BASE_URL.replace(/\/$/, "")}/auth/refresh`;
        const refreshRes = await fetch(refreshUrl, {
          method: "GET",
          credentials: "include",
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          useAuthStore.getState().setAuth(data.token, data.user, data.active_role);

          // Retry the original request with the fresh token.
          headers.set("Authorization", `Bearer ${data.token}`);
          const retryRes = await fetch(url, {
            ...options,
            headers,
            credentials: "include",
          });

          if (retryRes.ok) {
            return retryRes.json();
          }
        }
      } catch {
        // refresh failed — fall through to clearing auth
      }

      // Refresh failed or retry still 401 → clear and redirect (once, non-blocking).
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }

    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}
