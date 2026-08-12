import { useAuthStore, getAuthToken } from "./auth-store";
import { offlineEngine } from "./offline-engine";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export function getToken(): string | null {
  return getAuthToken();
}


let refreshPromise: Promise<string> | null = null;

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
  bypassQueue = false
): Promise<T> {
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;

  const isGet = !options.method || options.method.toUpperCase() === 'GET';

  const isAuthEndpoint =
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/forgot-password") ||
    endpoint.includes("/auth/reset-password") ||
    endpoint.includes("/auth/refresh");

  if (!isAuthEndpoint && !isGet && !bypassQueue && typeof navigator !== 'undefined' && !navigator.onLine) {
    toast.success("You are offline. Action queued.");
    await offlineEngine.queueRequest(endpoint, options);
    return { queued: true } as any;
  }

  try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Ensure cookies (like g4k_refresh_token) are passed
      });

      if (!response.ok) {
        // Auth endpoints (login/forgot/reset) own their 401 handling — never intercept.
        // A 401 on these means "invalid credentials", not "expired session".
        if (response.status === 401 && !isAuthEndpoint) {
          // Session may have expired — attempt ONE silent refresh via the HttpOnly cookie.
          // Mutex prevents concurrent 401 requests from making redundant refresh calls.
          try {
            if (!refreshPromise) {
              refreshPromise = (async () => {
                const refreshUrl = `${API_BASE_URL.replace(/\/$/, "")}/auth/refresh`;
                const refreshRes = await fetch(refreshUrl, {
                  method: "GET",
                  headers: { "X-Refresh-Token": useAuthStore.getState().refreshToken || "" },
                  credentials: "include",
                });

                if (!refreshRes.ok) {
                  throw new Error("Refresh failed");
                }

                const data = await refreshRes.json();
                useAuthStore.getState().setAuth(data.token, data.user, data.active_role, data.refresh_token);
                return data.token as string;
              })().finally(() => {
                refreshPromise = null;
              });
            }

            const newToken = await refreshPromise;

            // Retry the original request with the fresh token.
            headers.set("Authorization", `Bearer ${newToken}`);
            const retryRes = await fetch(url, {
              ...options,
              headers,
              credentials: "include",
            });

            if (retryRes.ok) {
              return await retryRes.json();
            }
          } catch {
            // refresh failed — fall through to clearing auth
          }

          // Refresh failed or retry still 401 → clear (AuthGuard will redirect).
          useAuthStore.getState().clearAuth();
          throw new Error("Session expired. Please log in again.");
        }

        // No client-side fetch retries (React Query handles GET retries)

        const errorData = await response.json().catch(() => ({}));

        if (response.status === 403) {
          if (errorData.needs_onboarding) {
            if (typeof window !== "undefined" && window.location.pathname !== "/onboarding") {
              window.location.href = "/onboarding";
            }
          } else {
            if (typeof window !== "undefined" && window.location.pathname !== "/dashboard") {
              window.location.href = "/dashboard?error=unauthorized";
            } else if (typeof window !== "undefined") {
              // If already on dashboard, just replace state so it triggers the toast
              window.history.replaceState(null, "", "/dashboard?error=unauthorized");
              window.dispatchEvent(new Event("popstate"));
            }
          }
        }

        const error = new Error(errorData.message || `Request failed with status ${response.status}`) as any;
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && (
        contentType.includes("text/csv") ||
        contentType.includes("application/pdf") ||
        contentType.includes("application/vnd.openxmlformats-officedocument") ||
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/vnd.ms-excel")
      )) {
        return (await response.blob()) as unknown as T;
      }

      return await response.json();
    } catch (error: any) {
      // Intercept offline / network failures for mutations (NOT 5xx server errors)
      const isNetworkError = error?.message?.includes("Failed to fetch") || (typeof navigator !== "undefined" && !navigator.onLine);
      if (!isAuthEndpoint && !isGet && !bypassQueue && isNetworkError) {
        toast.success("Network error. Action queued for sync.");
        await offlineEngine.queueRequest(endpoint, options);
        return { queued: true } as any;
      }

      throw error;
    }
}
