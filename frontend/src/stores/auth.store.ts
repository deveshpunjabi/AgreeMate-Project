'use client';

import { create } from 'zustand';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  email_verified: boolean;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  avatar_url?: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (updatedUser: Partial<User>) => void;
  clearAuth: () => void;
  hydrateAuth: () => void;
  logout: () => Promise<void>;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const AUTH_COOKIE_NAME = 'am_auth_active';
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const API_URL = RAW_API_URL.replace(/\/+$/, '');

const isSecureContext = () => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
};

const getCookieAttributes = () => {
  const attributes = ['path=/', 'max-age=604800', 'SameSite=Lax'];
  if (isSecureContext()) {
    attributes.push('Secure');
  }
  return attributes.join('; ');
};

const clearCookieAttributes = () => {
  const attributes = ['path=/', 'max-age=0', 'expires=Thu, 01 Jan 1970 00:00:00 GMT', 'SameSite=Lax'];
  if (isSecureContext()) {
    attributes.push('Secure');
  }
  return attributes.join('; ');
};

const safeParseUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  try {
    const storedUser = localStorage.getItem('am_user');
    return storedUser ? (JSON.parse(storedUser) as User) : null;
  } catch {
    localStorage.removeItem('am_user');
    return null;
  }
};

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return true;
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(decodedJson);
    if (!payload.exp) return false;
    // 10 second safety buffer
    return payload.exp * 1000 <= Date.now() + 10000;
  } catch {
    return true;
  }
};

const setAuthCookie = (isActive: boolean) => {
  if (typeof document === 'undefined') return;
  if (isActive) {
    document.cookie = `${AUTH_COOKIE_NAME}=true; ${getCookieAttributes()}`;
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; ${clearCookieAttributes()}`;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null, // Always null on first render to prevent SSR hydration mismatch
  accessToken: null,
  refreshToken: null,
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  hydrateAuth: () => {
    if (typeof window !== 'undefined') {
      const accessToken = localStorage.getItem('am_access_token');
      const user = safeParseUser();

      // Validate user presence and access token freshness
      if (!accessToken || !user || isTokenExpired(accessToken)) {
        const hadValidUser = Boolean(user && accessToken);
        localStorage.removeItem('am_user');
        localStorage.removeItem('am_access_token');
        localStorage.removeItem('am_refresh_token');
        localStorage.removeItem('am_last_activity');
        setAuthCookie(false);
        set({ user: null, accessToken: null, refreshToken: null });

        if (hadValidUser) {
          const manualLogout = sessionStorage.getItem('am_manual_logout') === 'true';
          if (!manualLogout) {
            axios
              .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
              .then((res) => {
                const { access_token, refresh_token: newRefreshToken, user: refreshedUser } = res.data;
                get().setAuth(refreshedUser || user, access_token, newRefreshToken);
              })
              .catch(() => {
                /* Session genuinely expired or invalid */
              });
          }
        }
        return;
      }

      // Refresh in-session activity timestamp on successful hydration
      localStorage.setItem('am_last_activity', Date.now().toString());
      setAuthCookie(true);

      set({
        user,
        accessToken,
        refreshToken: null,
      });
    }
  },

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('am_manual_logout');
      localStorage.setItem('am_user', JSON.stringify(user));
      localStorage.setItem('am_access_token', accessToken);
      localStorage.removeItem('am_refresh_token'); // Enforce removal of any legacy refresh tokens
      localStorage.setItem('am_last_activity', Date.now().toString());
      setAuthCookie(true);
    }
    set({ user, accessToken, refreshToken: refreshToken || null });
  },

  updateUser: (updatedUser) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedUser };
      if (typeof window !== 'undefined') {
        localStorage.setItem('am_user', JSON.stringify(newUser));
      }
      return { user: newUser };
    });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('am_user');
      localStorage.removeItem('am_access_token');
      localStorage.removeItem('am_refresh_token');
      localStorage.removeItem('am_last_activity');
      setAuthCookie(false);
    }
    set({ user: null, accessToken: null, refreshToken: null });
  },

  logout: async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`, {}, { withCredentials: true });
    } catch {
      /* best-effort session revocation */
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('am_manual_logout', 'true');
    }
    get().clearAuth();
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  },
}));
