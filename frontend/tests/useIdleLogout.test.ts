import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIdleLogout } from '@/hooks/useIdleLogout';

describe('useIdleLogout Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('sets initial last activity on mount when enabled', () => {
    renderHook(() => useIdleLogout(true));
    const stored = localStorage.getItem('am_last_activity');
    expect(stored).not.toBeNull();
    expect(Number(stored)).toBeGreaterThan(0);
  });

  it('does not register events when disabled', () => {
    renderHook(() => useIdleLogout(false));
    const stored = localStorage.getItem('am_last_activity');
    expect(stored).toBeNull();
  });
});
