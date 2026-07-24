import { describe, it, expect, beforeEach, vi } from 'vitest';
import { biometricService } from './biometricService';
import { BiometricAuth, BiometryError, BiometryErrorType, BiometryType } from '@aparajita/capacitor-biometric-auth';

const mockCheck = vi.mocked(BiometricAuth.checkBiometry);
const mockAuth = vi.mocked(BiometricAuth.authenticate);

const availableResult = (biometryType: number) => ({
  isAvailable: true, strongBiometryIsAvailable: true, biometryType,
  biometryTypes: [biometryType], deviceIsSecure: true, reason: '', code: '',
});

describe('biometricService.availability', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reports the enrolled sensor name when available', async () => {
    mockCheck.mockResolvedValueOnce(availableResult(BiometryType.fingerprintAuthentication) as any);
    const info = await biometricService.availability();
    expect(info.available).toBe(true);
    expect(info.label).toBe('Fingerprint');
    expect(info.reason).toBe('');
  });

  it('names Face ID correctly', async () => {
    mockCheck.mockResolvedValueOnce(availableResult(BiometryType.faceId) as any);
    expect((await biometricService.availability()).label).toBe('Face ID');
  });

  it('explains when no biometrics are enrolled', async () => {
    mockCheck.mockResolvedValueOnce({
      isAvailable: false, strongBiometryIsAvailable: false, biometryType: BiometryType.none,
      biometryTypes: [], deviceIsSecure: true, reason: 'not enrolled',
      code: BiometryErrorType.biometryNotEnrolled,
    } as any);
    const info = await biometricService.availability();
    expect(info.available).toBe(false);
    expect(info.reason).toMatch(/No biometrics are enrolled/i);
  });

  it('never throws when the plugin is missing (web preview)', async () => {
    mockCheck.mockRejectedValueOnce(new Error('plugin not implemented'));
    const info = await biometricService.availability();
    expect(info.available).toBe(false);
    expect(info.reason).toMatch(/mobile device build/i);
  });
});

describe('biometricService.authenticate', () => {
  beforeEach(() => vi.clearAllMocks());

  it('resolves ok on a successful prompt', async () => {
    mockAuth.mockResolvedValueOnce(undefined);
    expect(await biometricService.authenticate()).toEqual({ ok: true });
  });

  it('keeps the app PIN as the fallback (no device credential)', async () => {
    mockAuth.mockResolvedValueOnce(undefined);
    await biometricService.authenticate('Unlock');
    expect(mockAuth).toHaveBeenCalledWith(expect.objectContaining({
      allowDeviceCredential: false,
      cancelTitle: 'Use PIN',
    }));
  });

  it('flags a user cancel as cancelled, not an error', async () => {
    mockAuth.mockRejectedValueOnce(new BiometryError('cancelled', BiometryErrorType.userCancel as any));
    const r = await biometricService.authenticate();
    expect(r).toMatchObject({ ok: false, cancelled: true, lockedOut: false });
  });

  it('flags lockout so the UI can steer the user to the PIN', async () => {
    mockAuth.mockRejectedValueOnce(new BiometryError('locked', BiometryErrorType.biometryLockout as any));
    const r = await biometricService.authenticate();
    expect(r).toMatchObject({ ok: false, cancelled: false, lockedOut: true });
    if (!r.ok) expect(r.message).toMatch(/Too many failed attempts/i);
  });

  it('reports a failed match without throwing', async () => {
    mockAuth.mockRejectedValueOnce(new BiometryError('no match', BiometryErrorType.authenticationFailed as any));
    const r = await biometricService.authenticate();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/not recognised/i);
  });

  it('survives a non-BiometryError rejection', async () => {
    mockAuth.mockRejectedValueOnce(new Error('boom'));
    const r = await biometricService.authenticate();
    expect(r.ok).toBe(false);
  });
});
