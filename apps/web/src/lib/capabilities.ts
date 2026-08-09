import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api-client";
import { useAuthStore } from "./auth-store";

export function useCapabilities() {
  const token = useAuthStore((state) => state.token);

  return useQuery<string[]>({
    queryKey: ["capabilities", token],
    queryFn: async () => {
      if (!token) return [];
      const res = await apiFetch("/me/capabilities");
      if (typeof window !== "undefined") {
        document.cookie = `g4k_capabilities=${encodeURIComponent(JSON.stringify(res.capabilities || []))}; path=/; max-age=86400; SameSite=Lax`;
      }
      return res.capabilities || [];
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function hasCapability(capabilities: string[] = [], requiredCapability: string): boolean {
  if (capabilities.includes("*")) {
    return true;
  }
  return capabilities.includes(requiredCapability);
}
