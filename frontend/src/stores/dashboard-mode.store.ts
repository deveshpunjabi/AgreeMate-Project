import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DashboardMode = 'owner' | 'party';

interface DashboardModeState {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
}

export const useDashboardModeStore = create<DashboardModeState>()(
  persist(
    (set) => ({
      mode: 'owner',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'agreemate-dashboard-mode',
    }
  )
);
