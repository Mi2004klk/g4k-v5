import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api-client";
import { useAuthStore } from "./auth-store";
import { queryKeys } from "./query-keys";

const getCapabilitiesFromCookie = (): string[] | undefined => {
  if (typeof window === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|; )g4k_capabilities=([^;]*)/);
  if (match) {
    try {
      return JSON.parse(decodeURIComponent(match[1]));
    } catch {
      return undefined;
    }
  }
  return undefined;
};

export function useCapabilities() {
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: queryKeys.capabilities(),
    queryFn: async () => {
      if (!token) return [];
      try {
        const res = await apiFetch<{ capabilities?: string[] }>("/me/capabilities");
        if (!res.capabilities) {
          return [];
        }
        if (typeof window !== "undefined") {
          document.cookie = `g4k_capabilities=${encodeURIComponent(JSON.stringify(res.capabilities))}; path=/; max-age=604800; SameSite=Lax`;
        }
        return res.capabilities;
      } catch (err) {
        throw err;
      }
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData: getCapabilitiesFromCookie(),
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
  });
}

const SELF_SERVICE_EXCLUDED = ["attendance.clock-self"] as const;

export function hasCapability(capabilities: string[] = [], requiredCapability: string): boolean {
  if (SELF_SERVICE_EXCLUDED.includes(requiredCapability as typeof SELF_SERVICE_EXCLUDED[number])) {
    return capabilities.includes(requiredCapability);
  }
  if (capabilities.includes("*")) {
    return true;
  }
  return capabilities.includes(requiredCapability);
}
