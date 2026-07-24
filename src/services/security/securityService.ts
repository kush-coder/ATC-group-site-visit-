/**
 * Local security helpers: PIN hashing (SHA-256) and session timeout.
 * We never store the raw PIN. Sensitive settings are kept in Preferences.
 */
import { Preferences } from '@capacitor/preferences';

const SESSION_KEY = 'atc_last_active';
const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const securityService = {
  async hashPin(pin: string): Promise<string> {
    return sha256(`atc-salt::${pin}`);
  },

  async verifyPin(pin: string, hash: string | null): Promise<boolean> {
    if (!hash) return false;
    return (await this.hashPin(pin)) === hash;
  },

  async markActive(): Promise<void> {
    await Preferences.set({ key: SESSION_KEY, value: String(Date.now()) });
  },

  async isSessionExpired(): Promise<boolean> {
    const { value } = await Preferences.get({ key: SESSION_KEY });
    if (!value) return true;
    return Date.now() - Number(value) > SESSION_TIMEOUT_MS;
  },

  async setSetting(key: string, value: string): Promise<void> {
    await Preferences.set({ key: `atc_${key}`, value });
  },
  async getSetting(key: string): Promise<string | null> {
    const { value } = await Preferences.get({ key: `atc_${key}` });
    return value;
  },
};
