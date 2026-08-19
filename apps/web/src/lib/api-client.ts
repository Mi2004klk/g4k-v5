import { useAuthStore, getAuthToken } from "./auth-store";
import { offlineEngine } from "./offline-engine";
import { toast } from "sonner";

let API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
if (API_BASE_URL.startsWith("http") && !API_BASE_URL.endsWith("/api")) {
  API_BASE_URL = `${API_BASE_URL.replace(/\/$/, "")}/api`;
}

export function getToken(): string | null {
  return getAuthToken();
}

/**
 * Standardize single resource responses.
 * @param res The API response
 * @returns The unwrapped resource
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- HTTP boundary: API response shape is runtime-determined
export function unwrapOne<T = any>(res: any): T | null {
  if (!res) return null;
  if (res && typeof res === "object" && "data" in res) {
    if (res.data && typeof res.data === "object" && !Array.isArray(res.data) && "id" in res.data) {
      return res.data as T;
    }
  }
  return res as T;
}

/**
 * Standardize list responses.
 * @param res The API response
 * @returns The unwrapped array
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- HTTP boundary: API response shape is runtime-determined
export function unwrapList<T = any>(res: any): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res && typeof res === "object") {
    if (Array.isArray(res.data)) return res.data;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
  }
  return [];
}

export function isQueued(res: any): boolean {
  return res && typeof res === "object" && res.queued === true;
}



let refreshPromise: Promise<string> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- HTTP boundary: API response shape is runtime-determined
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
    toast.warning("You are offline. Action queued.");
    await offlineEngine.queueRequest(endpoint, options);
    return { queued: true } as unknown as T;
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
                  headers: {
                    "Accept": "application/json",
                    "X-Refresh-Token": useAuthStore.getState().refreshToken || "",
                  },
                  credentials: "include",
                });

                if (!refreshRes.ok) {
                  throw new Error("Refresh failed");
                }

                const data = await refreshRes.json();
                useAuthStore.getState().setAuth(data.token, data.user, data.active_role, data.refresh_token, data.capabilities);
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
          if (typeof window !== "undefined") {
            window.location.href = "/login?reason=expired";
          }
          throw new Error("Session expired. Please log in again.");
        }

        // No client-side fetch retries (React Query handles GET retries)

        const errorData = await response.json().catch(() => ({}));

        if (response.status === 403) {
          if (errorData.needs_onboarding) {
            const curUser = useAuthStore.getState().user;
            const curToken = getAuthToken();
            if (curUser && curToken) {
              useAuthStore.getState().setAuth(curToken, { ...curUser, onboarded_at: null }, curUser.active_role || 'employee');
            }
          } else if (errorData.must_change_password) {
            const curUser = useAuthStore.getState().user;
            const curToken = getAuthToken();
            if (curUser && curToken) {
              useAuthStore.getState().setAuth(curToken, { ...curUser, must_change_password: true }, curUser.active_role || 'employee');
            }
          }
        }

        let msg = errorData.message || `Request failed with status ${response.status}`;
        if (response.status === 422 && errorData.errors) {
          msg = Object.values(errorData.errors).flat().join(', ') || msg;
        }
        const error = new Error(msg) as Error & { status?: number, data?: unknown, errors?: Record<string, string[]> };
        error.status = response.status;
        error.data = errorData;
        if (errorData.errors) {
          error.errors = errorData.errors;
        }
        throw error;
      }

      if (typeof window !== "undefined" && token && !isAuthEndpoint) {
        document.cookie = `g4k_token=${token}; path=/; max-age=604800; SameSite=Lax`;
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

      const data = await response.json();
      
      // Contract completion: If API returns a bare array, wrap it to match standard Laravel paginated/resource structure
      if (Array.isArray(data)) {
        return { data } as unknown as T;
      }
      
      return data;
    } catch (error: unknown) {
      // Intercept offline / network failures for mutations (NOT 5xx server errors)
      const err = error instanceof Error ? error : new Error("Unknown error");
      const isNetworkError = err.message?.includes("Failed to fetch") || (typeof navigator !== "undefined" && !navigator.onLine);
      if (!isAuthEndpoint && !isGet && !bypassQueue && isNetworkError) {
        toast.warning("Network error. Action queued for sync.");
        await offlineEngine.queueRequest(endpoint, options);
        return { queued: true } as unknown as T;
      }

      throw err;
    }
}
