import { describe, it, expect, beforeEach } from 'vitest';
import { useWizardStore } from '@/stores/wizard.store';

describe('Wizard Store', () => {
  beforeEach(() => {
    useWizardStore.getState().closeWizard();
  });

  it('initializes with closed state and null initialItemId', () => {
    const state = useWizardStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.initialItemId).toBeNull();
  });

  it('opens wizard without initial item ID', () => {
    useWizardStore.getState().openWizard();
    const state = useWizardStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.initialItemId).toBeNull();
  });

  it('opens wizard with specific initial item ID', () => {
    useWizardStore.getState().openWizard('item_sony_a7');
    const state = useWizardStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.initialItemId).toBe('item_sony_a7');
  });

  it('closes wizard and resets item ID', () => {
    useWizardStore.getState().openWizard('item_sony_a7');
    useWizardStore.getState().closeWizard();
    const state = useWizardStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.initialItemId).toBeNull();
  });
});
