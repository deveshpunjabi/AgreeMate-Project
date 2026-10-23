'use client';

import { create } from 'zustand';

interface WizardState {
  isOpen: boolean;
  initialItemId: string | null;
  openWizard: (itemId?: string) => void;
  closeWizard: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  isOpen: false,
  initialItemId: null,
  openWizard: (itemId?: string) => set({ isOpen: true, initialItemId: itemId || null }),
  closeWizard: () => set({ isOpen: false, initialItemId: null }),
}));
