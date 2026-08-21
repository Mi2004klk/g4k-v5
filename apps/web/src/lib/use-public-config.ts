import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api-client";

interface PublicConfig {
  name: string;
  logo_url: string | null;
}

export function usePublicConfig() {
  return useQuery({
    queryKey: ["system_public_config"],
    queryFn: async () => {
      try {
        const res = await apiFetch("/system/public-config");
        return res as PublicConfig;
      } catch (e) {
        return { name: "My Company", logo_url: null };
      }
    },
    staleTime: 3600 * 1000, // 1 hour
    retry: false
  });
}
