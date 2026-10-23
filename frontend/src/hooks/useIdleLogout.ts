'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/lib/api/auth';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const ACTIVITY_THROTTLE_MS = 2000; // Throttle activity updates to once every 2 seconds
const LAST_ACTIVITY_KEY = 'am_last_activity';

export function useIdleLogout(enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const logout = async () => {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;

      const { refreshToken, clearAuth } = useAuthStore.getState();
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          /* best-effort server session revocation */
        }
      }
      clearAuth();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      window.location.replace('/login?session_expired=true');
    };

    const getStoredLastActivity = (): number => {
      const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (!stored) {
        const now = Date.now();
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
        return now;
      }
      const parsed = Number(stored);
      return isNaN(parsed) ? Date.now() : parsed;
    };

    const checkAndScheduleTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const lastActivity = getStoredLastActivity();
      const now = Date.now();
      const elapsed = now - lastActivity;

      if (elapsed >= IDLE_TIMEOUT_MS) {
        logout();
      } else {
        const remaining = IDLE_TIMEOUT_MS - elapsed;
        timerRef.current = setTimeout(logout, Math.max(1000, remaining));
      }
    };

    const updateLastActivity = () => {
      const now = Date.now();
      const last = getStoredLastActivity();
      if (now - last < ACTIVITY_THROTTLE_MS) return;
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      checkAndScheduleTimer();
    };

    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Initialize/refresh activity timestamp on mount
    updateLastActivity();

    events.forEach((evt) => window.addEventListener(evt, updateLastActivity, { passive: true }));

    // Re-check when tab regains focus or visibility
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAndScheduleTimer();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Cross-tab synchronization via localStorage events
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY) {
        checkAndScheduleTimer();
      }
      if (e.key === 'am_user' && e.newValue === null) {
        useAuthStore.getState().clearAuth();
        window.location.replace('/login');
      }
    };
    window.addEventListener('storage', onStorageChange);

    checkAndScheduleTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((evt) => window.removeEventListener(evt, updateLastActivity));
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorageChange);
    };
  }, [enabled]);
}
