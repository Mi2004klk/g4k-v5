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
  setAuth: (token: string, user: UserProfile, activeRole?: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      activeRole: null,
      setAuth: (token, user, activeRole) =>
        set({
          token,
          user,
          activeRole: activeRole || user.active_role || user.roles?.[0] || "employee",
        }),
      clearAuth: () => set({ token: null, user: null, activeRole: null }),
    }),
    {
      name: "g4k-auth",
    }
  )
);
