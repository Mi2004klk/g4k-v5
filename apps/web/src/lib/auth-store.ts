import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  remember: boolean;
  setAuth: (token: string, user: UserProfile, activeRole?: string, refreshToken?: string, capabilities?: string[], broadcast?: boolean, remember?: boolean) => void;
  setDensity: (density: "comfortable" | "compact") => void;
  updateUser: (partial: Partial<UserProfile>) => void;
  clearAuth: (broadcast?: boolean) => void;
}

let authChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined") {
  authChannel = new BroadcastChannel("g4k_auth_sync");
}

const customStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    let val = null;
    if (typeof localStorage !== 'undefined') val = localStorage.getItem(name);
    if (!val && typeof sessionStorage !== 'undefined') val = sessionStorage.getItem(name);
    return val;
  },
  setItem: (name: string, value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (parsed.state?.remember) {
        if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(name);
      } else {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(name, value);
        if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
      }
    } catch {
      if (typeof localStorage !== 'undefined') localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(name);
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(name);
  }
}));

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      activeRole: null,
      density: "compact",
      remember: false,
      setAuth: (token, user, activeRole, refreshToken, capabilities, broadcast = true, remember) => {
        return set((state) => {
          const finalRemember = remember !== undefined ? remember : (state.remember ?? false);

          if (typeof window !== "undefined") {
            const cookiePrefix = `g4k_token=${token}; path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
            document.cookie = finalRemember ? `${cookiePrefix}; max-age=604800` : cookiePrefix;
            
            if (capabilities && Array.isArray(capabilities)) {
              try {
                const encoded = encodeURIComponent(JSON.stringify(capabilities));
                const capPrefix = `g4k_capabilities_${user.id}=${encoded}; path=/; SameSite=Lax`;
                document.cookie = finalRemember ? `${capPrefix}; max-age=604800` : capPrefix;
              } catch {}
            }
            if (broadcast && authChannel) {
              authChannel.postMessage({ type: "LOGIN" });
            }
          }
          return {
            token,
            refreshToken: refreshToken ?? state.refreshToken,
            user,
            activeRole: activeRole || user.active_role || user.roles?.[0] || "employee",
            remember: finalRemember,
          };
        });
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
          return { token: null, refreshToken: null, user: null, activeRole: null, remember: false };
        });
      },
    }),
    {
      name: "g4k-auth",
      storage: customStorage,
      skipHydration: true,
      partialize: (state) => ({ 
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user, 
        activeRole: state.activeRole, 
        density: state.density,
        remember: state.remember
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
