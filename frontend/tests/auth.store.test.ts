import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';

describe('Auth Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
    });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
    if (typeof document !== 'undefined') {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
    }
  });

  it('should initialize with null values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('should set authentication data correctly and update storage', () => {
    const user = {
      id: '123',
      email: 'test@example.com',
      role: 'user' as const,
      email_verified: true,
    };
    
    useAuthStore.getState().setAuth(user, 'access_token_123', 'refresh_token_456');
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe('access_token_123');
    expect(state.refreshToken).toBe('refresh_token_456');

    if (typeof window !== 'undefined' && window.localStorage) {
      expect(localStorage.getItem('am_user')).toEqual(JSON.stringify(user));
      expect(localStorage.getItem('am_access_token')).toBe('access_token_123');
      expect(localStorage.getItem('am_refresh_token')).toBeNull();
      expect(localStorage.getItem('am_last_activity')).not.toBeNull();
    }
  });

  it('should clear authentication data correctly and purge storage', () => {
    const user = { id: '123', email: 'test@example.com', role: 'user' as const, email_verified: true };
    useAuthStore.getState().setAuth(user, 'token', 'refresh');
    useAuthStore.getState().clearAuth();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();

    if (typeof window !== 'undefined' && window.localStorage) {
      expect(localStorage.getItem('am_user')).toBeNull();
      expect(localStorage.getItem('am_access_token')).toBeNull();
      expect(localStorage.getItem('am_refresh_token')).toBeNull();
      expect(localStorage.getItem('am_last_activity')).toBeNull();
    }
  });

  it('should update user profile correctly', () => {
    const user = { id: '123', email: 'test@example.com', role: 'user' as const, email_verified: true };
    useAuthStore.getState().setAuth(user, 'token', 'refresh');
    
    useAuthStore.getState().updateUser({ full_name: 'Test User', city: 'Mumbai' });
    
    const state = useAuthStore.getState();
    expect(state.user?.full_name).toBe('Test User');
    expect(state.user?.city).toBe('Mumbai');
    expect(state.user?.email).toBe('test@example.com');
  });

  it('should hydrate auth from valid localStorage tokens', () => {
    const user = { id: '123', email: 'test@example.com', role: 'user' as const, email_verified: true };
    // Valid JWT format with exp in year 2050
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjI1Mzc4NjU2MDB9.signature';
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('am_user', JSON.stringify(user));
      localStorage.setItem('am_access_token', validToken);
    }
    
    useAuthStore.getState().hydrateAuth();
    
    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe(validToken);
    expect(state.refreshToken).toBeNull();
  });

  it('should purge invalid/expired tokens during hydration', () => {
    const user = { id: '123', email: 'test@example.com', role: 'user' as const, email_verified: true };
    // Expired JWT format with exp in year 2000
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJleHAiOjk0NjY4NDgwMH0.signature';
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('am_user', JSON.stringify(user));
      localStorage.setItem('am_access_token', expiredToken);
    }
    
    useAuthStore.getState().hydrateAuth();
    
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
  });
});
