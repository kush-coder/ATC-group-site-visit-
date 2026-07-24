/**
 * Auto-save draft persistence. The in-progress visit form state is stored in
 * Preferences after each section so an accidental app close never loses work
 * (captured image paths are kept, so images survive too).
 */
import { Preferences } from '@capacitor/preferences';

const DRAFT_KEY = 'atc_active_draft';

export const draftService = {
  async save(state: unknown): Promise<void> {
    await Preferences.set({ key: DRAFT_KEY, value: JSON.stringify({ savedAt: Date.now(), state }) });
  },
  async load<T>(): Promise<{ savedAt: number; state: T } | null> {
    const { value } = await Preferences.get({ key: DRAFT_KEY });
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  },
  async clear(): Promise<void> {
    await Preferences.remove({ key: DRAFT_KEY });
  },
  async has(): Promise<boolean> {
    const { value } = await Preferences.get({ key: DRAFT_KEY });
    return !!value;
  },
};
