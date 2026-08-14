import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  username?: string;
  employee_id?: string;
  must_change_password?: boolean;
  onboarded_at?: string | null;
  active_status: string;
  preferences?: {
    theme_mode?: string;
    density?: string;
    directory_visibility?: string;
    [key: string]: any;
  };
  active_role?: string;
  roles?: string[];
  role_assignments?: any[];
  department?: any;
  designation?: any;
  company?: any;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  activeRole: string | null;
  density: "comfortable" | "compact";
  setAuth: (token: string, user: UserProfile, activeRole?: string, refreshToken?: string, capabilities?: string[]) => void;
  setDensity: (density: "comfortable" | "compact") => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      activeRole: null,
      density: "compact",
      setAuth: (token, user, activeRole, refreshToken, capabilities) => {
        if (typeof window !== "undefined") {
          document.cookie = `g4k_token=${token}; path=/; max-age=604800; SameSite=Lax`;
          if (capabilities && Array.isArray(capabilities)) {
            try {
              const encoded = encodeURIComponent(JSON.stringify(capabilities));
              document.cookie = `g4k_capabilities=${encoded}; path=/; max-age=604800; SameSite=Lax`;
            } catch {}
          }
        }
        return set((state) => ({
          token,
          refreshToken: refreshToken ?? state.refreshToken,
          user,
          activeRole: activeRole || user.active_role || user.roles?.[0] || "employee",
        }));
      },
      setDensity: (density) => set({ density }),
      clearAuth: () => {
        if (typeof window !== "undefined") {
          document.cookie = `g4k_token=; path=/; max-age=0; SameSite=Lax`;
          document.cookie = `g4k_capabilities=; path=/; max-age=0; SameSite=Lax`;
        }
        return set({ token: null, refreshToken: null, user: null, activeRole: null });
      },
    }),
    {
      name: "g4k-auth",
      skipHydration: true,
    }
  )
);

export const getAuthToken = () => useAuthStore.getState().token;
