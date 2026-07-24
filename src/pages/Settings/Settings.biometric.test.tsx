import { describe, it, expect, beforeEach, vi } from 'vitest';
import Settings from './Settings';
import { renderPage, screen, waitFor } from '@/test/utils';
import { resetFixtures } from '@/test/setup';
import { employeeRepo } from '@/services/database/repository';
import { BiometricAuth, BiometryErrorType, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { fixtures } from '@/test/setup';

const mockCheck = vi.mocked(BiometricAuth.checkBiometry);
const mockAuth = vi.mocked(BiometricAuth.authenticate);
const mockUpsert = vi.mocked(employeeRepo.upsert);

const enrolled = {
  isAvailable: true, strongBiometryIsAvailable: true,
  biometryType: BiometryType.fingerprintAuthentication,
  biometryTypes: [BiometryType.fingerprintAuthentication],
  deviceIsSecure: true, reason: '', code: '',
} as any;

/** The biometric toggle is the second switch in the Security card. */
const biometricToggle = () => screen.getAllByRole('checkbox')[1];

describe('Settings — biometric unlock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses to enable biometrics until a PIN exists (PIN is the fallback)', async () => {
    resetFixtures({ pin_enabled: 0 });
    mockCheck.mockResolvedValue(enrolled);
    renderPage(Settings, { route: '/settings' });

    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1));
    biometricToggle().click();

    await waitFor(() => {
      expect(fixtures.state.toasts.some((t) => /PIN first/i.test(t.msg))).toBe(true);
    });
    expect(mockAuth).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalledWith(expect.objectContaining({ biometric_enabled: 1 }));
  });

  it('verifies the sensor before enabling, then persists', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash' });
    mockCheck.mockResolvedValue(enrolled);
    mockAuth.mockResolvedValue(undefined);
    renderPage(Settings, { route: '/settings' });

    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1));
    biometricToggle().click();

    await waitFor(() => expect(mockAuth).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ biometric_enabled: 1 }))
    );
  });

  it('does not enable when the verification prompt fails', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash' });
    mockCheck.mockResolvedValue(enrolled);
    const { BiometryError } = await import('@aparajita/capacitor-biometric-auth');
    mockAuth.mockRejectedValue(new BiometryError('cancelled', BiometryErrorType.userCancel as any));
    renderPage(Settings, { route: '/settings' });

    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1));
    biometricToggle().click();

    await waitFor(() => expect(mockAuth).toHaveBeenCalled());
    expect(mockUpsert).not.toHaveBeenCalledWith(expect.objectContaining({ biometric_enabled: 1 }));
  });

  it('surfaces the reason when the device has no enrolled biometrics', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash' });
    mockCheck.mockResolvedValue({
      isAvailable: false, strongBiometryIsAvailable: false, biometryType: BiometryType.none,
      biometryTypes: [], deviceIsSecure: true, reason: 'not enrolled',
      code: BiometryErrorType.biometryNotEnrolled,
    } as any);
    renderPage(Settings, { route: '/settings' });

    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1));
    biometricToggle().click();

    await waitFor(() =>
      expect(fixtures.state.toasts.some((t) => /No biometrics are enrolled/i.test(t.msg))).toBe(true)
    );
    expect(mockUpsert).not.toHaveBeenCalledWith(expect.objectContaining({ biometric_enabled: 1 }));
  });

  it('turning it off needs no prompt', async () => {
    resetFixtures({ pin_enabled: 1, pin_hash: 'hash', biometric_enabled: 1 });
    mockCheck.mockResolvedValue(enrolled);
    renderPage(Settings, { route: '/settings' });

    await waitFor(() => expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(1));
    biometricToggle().click();

    await waitFor(() =>
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({ biometric_enabled: 0 }))
    );
    expect(mockAuth).not.toHaveBeenCalled();
  });
});
