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
  department?: any;
  designation?: any;
  company?: any;
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  activeRole: string | null;
  density: "comfortable" | "compact";
  setAuth: (token: string, user: UserProfile, activeRole?: string) => void;
  setDensity: (density: "comfortable" | "compact") => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeRole: null,
      density: "comfortable",
      setAuth: (token, user, activeRole) => {
        if (typeof window !== "undefined") {
          document.cookie = `g4k_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        return set({
          token,
          user,
          activeRole: activeRole || user.active_role || user.roles?.[0] || "employee",
        });
      },
      setDensity: (density) => set({ density }),
      clearAuth: () => {
        if (typeof window !== "undefined") {
          document.cookie = `g4k_token=; path=/; max-age=0; SameSite=Lax`;
          document.cookie = `g4k_capabilities=; path=/; max-age=0; SameSite=Lax`;
        }
        return set({ token: null, user: null, activeRole: null });
      },
    }),
    {
      name: "g4k-auth",
    }
  )
);

export const getAuthToken = () => useAuthStore.getState().token;
