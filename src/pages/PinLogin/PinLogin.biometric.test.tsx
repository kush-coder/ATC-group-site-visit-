import { describe, it, expect, beforeEach, vi } from 'vitest';
import PinLogin from './PinLogin';
import { renderPage, screen, waitFor } from '@/test/utils';
import { resetFixtures } from '@/test/setup';
import { BiometricAuth, BiometryErrorType, BiometryType } from '@aparajita/capacitor-biometric-auth';

const mockCheck = vi.mocked(BiometricAuth.checkBiometry);
const mockAuth = vi.mocked(BiometricAuth.authenticate);

const enrolled = {
  isAvailable: true, strongBiometryIsAvailable: true,
  biometryType: BiometryType.fingerprintAuthentication,
  biometryTypes: [BiometryType.fingerprintAuthentication],
  deviceIsSecure: true, reason: '', code: '',
} as any;

const unavailable = {
  isAvailable: false, strongBiometryIsAvailable: false, biometryType: BiometryType.none,
  biometryTypes: [], deviceIsSecure: false, reason: 'unavailable',
  code: BiometryErrorType.biometryNotAvailable,
} as any;

describe('PinLogin — biometric unlock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('prompts automatically when the employee has enabled biometrics', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash', biometric_enabled: 1 });
    mockCheck.mockResolvedValue(enrolled);
    mockAuth.mockResolvedValue(undefined);

    renderPage(PinLogin, { route: '/pin' });

    await waitFor(() => expect(mockAuth).toHaveBeenCalledTimes(1));
  });

  it('does not prompt when biometrics are switched off', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash', biometric_enabled: 0 });
    mockCheck.mockResolvedValue(enrolled);

    renderPage(PinLogin, { route: '/pin' });
    await screen.findByText('Enter your PIN');

    expect(mockAuth).not.toHaveBeenCalled();
  });

  it('does not prompt when the device has no usable biometrics', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash', biometric_enabled: 1 });
    mockCheck.mockResolvedValue(unavailable);

    renderPage(PinLogin, { route: '/pin' });
    await waitFor(() => expect(mockCheck).toHaveBeenCalled());

    expect(mockAuth).not.toHaveBeenCalled();
    // The PIN keypad is still fully usable.
    expect(screen.getByText('Enter your PIN')).toBeInTheDocument();
  });

  it('falls back to the PIN keypad when biometrics are locked out', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash', biometric_enabled: 1 });
    mockCheck.mockResolvedValue(enrolled);
    const { BiometryError } = await import('@aparajita/capacitor-biometric-auth');
    mockAuth.mockRejectedValue(new BiometryError('locked', BiometryErrorType.biometryLockout as any));

    renderPage(PinLogin, { route: '/pin' });

    await waitFor(() => expect(mockAuth).toHaveBeenCalled());
    expect(screen.getByText('Enter your PIN')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('disables the biometric key when the feature is off', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash', biometric_enabled: 0 });
    mockCheck.mockResolvedValue(enrolled);

    renderPage(PinLogin, { route: '/pin' });
    const btn = await screen.findByLabelText('Unlock with biometrics');
    expect(btn).toBeDisabled();
  });
});
