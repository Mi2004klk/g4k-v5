import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api-client";

interface PublicConfig {
  name: string;
  logo_url: string | null;
  force_password_change_compulsive?: boolean;
  password_policy?: {
    min_length: number;
    require_mixed: boolean;
    require_number: boolean;
    require_symbol: boolean;
  };
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
