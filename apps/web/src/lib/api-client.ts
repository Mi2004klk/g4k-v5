import { useAuthStore } from "./auth-store";

const API_BASE_URL = "/api";

export function getToken(): string | null {
  return useAuthStore.getState().token;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

  const isGet = !options.method || options.method.toUpperCase() === 'GET';
  const maxRetries = isGet ? 3 : 0;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
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

        // Retry for server errors on GET requests
        if (isGet && response.status >= 500 && attempt < maxRetries) {
          throw new Error(`Server error ${response.status}`);
        }

        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403) {
          if (errorData.must_change_password) {
            if (typeof window !== "undefined" && window.location.pathname !== "/change-password") {
              window.location.href = "/change-password";
            }
          } else if (errorData.needs_onboarding) {
            if (typeof window !== "undefined" && window.location.pathname !== "/onboarding") {
              window.location.href = "/onboarding";
            }
          }
        }

        const error = new Error(errorData.message || `Request failed with status ${response.status}`) as any;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      if (attempt >= maxRetries || error.message.includes("Session expired")) {
        throw error;
      }
      attempt++;
      // Exponential backoff: 500ms, 1000ms, 2000ms
      await sleep(500 * Math.pow(2, attempt - 1));
    }
  }
  
  throw new Error("Request failed after max retries");
}
