import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  username?: string;
  employee_id?: string;
  avatar_url?: string | null;
  must_change_password?: boolean;
  onboarded_at?: string | null;
  active_status: string;
  timezone?: string;
  preferences?: {
    theme_mode?: string;
    density?: string;
    directory_visibility?: string;
    [key: string]: unknown;
  };
  active_role?: string;
  roles?: string[];
  role_assignments?: unknown[];
  department?: unknown;
  designation?: unknown;
  company?: unknown;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  activeRole: string | null;
  density: "comfortable" | "compact";
  setAuth: (token: string, user: UserProfile, activeRole?: string, refreshToken?: string, capabilities?: string[], broadcast?: boolean) => void;
  setDensity: (density: "comfortable" | "compact") => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  clearAuth: (broadcast?: boolean) => void;
}

let authChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined") {
  authChannel = new BroadcastChannel("g4k_auth_sync");
}


export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      activeRole: null,
      density: "compact",
      setAuth: (token, user, activeRole, refreshToken, capabilities, broadcast = true) => {
        if (typeof window !== "undefined") {
          document.cookie = `g4k_token=${token}; path=/; max-age=604800; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
          if (capabilities && Array.isArray(capabilities)) {
            try {
              const encoded = encodeURIComponent(JSON.stringify(capabilities));
              document.cookie = `g4k_capabilities_${user.id}=${encoded}; path=/; max-age=604800; SameSite=Lax`;
            } catch {}
          }
          if (broadcast && authChannel) {
            authChannel.postMessage({ type: "LOGIN" });
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
      updateUser: (partial) => set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
      clearAuth: (broadcast = true) => {
        return set((state) => {
          if (typeof window !== "undefined") {
            document.cookie = `g4k_token=; path=/; max-age=0; SameSite=Lax`;
            if (state.user?.id) {
              document.cookie = `g4k_capabilities_${state.user.id}=; path=/; max-age=0; SameSite=Lax`;
            }
            if (broadcast && authChannel) {
              authChannel.postMessage({ type: "LOGOUT" });
            }
          }
          return { token: null, refreshToken: null, user: null, activeRole: null };
        });
      },
    }),
    {
      name: "g4k-auth",
      skipHydration: true,
      partialize: (state) => ({ 
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user, 
        activeRole: state.activeRole, 
        density: state.density 
      }),
    }
  )
);

if (typeof window !== "undefined" && authChannel) {
  authChannel.onmessage = (event) => {
    if (event.data?.type === "LOGOUT") {
      useAuthStore.getState().clearAuth(false);
      window.location.href = "/login?reason=logged_out";
    } else if (event.data?.type === "LOGIN") {
      window.location.reload();
    }
  };
}

export const getAuthToken = () => {
  const stateToken = useAuthStore.getState().token;
  if (stateToken) return stateToken;
  
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp('(^| )g4k_token=([^;]+)'));
    if (match) return match[2];
  }
  
  return null;
};
