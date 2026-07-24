/**
 * Biometric unlock built on @aparajita/capacitor-biometric-auth.
 *
 * Design rules:
 * - Never throws. Every path resolves to a typed result so the UI can react
 *   without try/catch, and a device without biometry simply reports it.
 * - Biometry is an *accelerator* for the PIN, never a replacement: the PIN
 *   stays the fallback so a failed / locked-out sensor can never lock a user
 *   out of their own on-device data.
 */
import { BiometricAuth, BiometryType, BiometryError, BiometryErrorType } from '@aparajita/capacitor-biometric-auth';

export interface BiometryAvailability {
  available: boolean;
  /** Human-readable sensor name, e.g. "Fingerprint" / "Face ID". */
  label: string;
  /** Why it is unavailable, suitable for showing to the user. */
  reason: string;
}

export type BiometricOutcome =
  | { ok: true }
  | { ok: false; cancelled: boolean; lockedOut: boolean; message: string };

function labelFor(type: BiometryType): string {
  switch (type) {
    case BiometryType.touchId: return 'Touch ID';
    case BiometryType.faceId: return 'Face ID';
    case BiometryType.fingerprintAuthentication: return 'Fingerprint';
    case BiometryType.faceAuthentication: return 'Face unlock';
    case BiometryType.irisAuthentication: return 'Iris unlock';
    default: return 'Biometrics';
  }
}

/** Map a plugin error code to a message an employee can act on. */
function messageFor(code: BiometryErrorType, fallback: string): string {
  switch (code) {
    case BiometryErrorType.biometryNotEnrolled:
      return 'No biometrics are enrolled on this device. Add a fingerprint or face in device settings first.';
    case BiometryErrorType.biometryNotAvailable:
      return 'This device does not support biometric unlock.';
    case BiometryErrorType.biometryLockout:
      return 'Too many failed attempts. Use your PIN to continue.';
    case BiometryErrorType.passcodeNotSet:
    case BiometryErrorType.noDeviceCredential:
      return 'Set a device screen lock to use biometric unlock.';
    case BiometryErrorType.userCancel:
    case BiometryErrorType.systemCancel:
    case BiometryErrorType.appCancel:
      return 'Biometric unlock cancelled.';
    case BiometryErrorType.userFallback:
      return 'Use your PIN to continue.';
    case BiometryErrorType.authenticationFailed:
      return 'Biometric not recognised. Try again or use your PIN.';
    default:
      return fallback || 'Biometric unlock is unavailable.';
  }
}

export const biometricService = {
  /** Does this device have usable, enrolled biometry right now? */
  async availability(): Promise<BiometryAvailability> {
    try {
      const info = await BiometricAuth.checkBiometry();
      return {
        available: info.isAvailable,
        label: labelFor(info.biometryType),
        reason: info.isAvailable
          ? ''
          : messageFor(info.code as BiometryErrorType, info.reason ?? 'Biometric unlock is unavailable on this device.'),
      };
    } catch {
      // Web preview / plugin missing -> quietly unsupported.
      return { available: false, label: 'Biometrics', reason: 'Biometric unlock is only available on the mobile device build.' };
    }
  },

  /** Prompt the sensor. Resolves to a typed outcome, never throws. */
  async authenticate(reason = 'Unlock ATC FieldConnect'): Promise<BiometricOutcome> {
    try {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Use PIN',
        androidTitle: 'ATC FieldConnect',
        androidSubtitle: reason,
        androidConfirmationRequired: false,
        // Keep the app's own PIN as the fallback rather than the device
        // credential, so the lock stays consistent across devices.
        allowDeviceCredential: false,
      });
      return { ok: true };
    } catch (error) {
      const code = error instanceof BiometryError ? error.code : BiometryErrorType.none;
      const cancelled =
        code === BiometryErrorType.userCancel ||
        code === BiometryErrorType.systemCancel ||
        code === BiometryErrorType.appCancel ||
        code === BiometryErrorType.userFallback;
      return {
        ok: false,
        cancelled,
        lockedOut: code === BiometryErrorType.biometryLockout,
        message: messageFor(code, error instanceof Error ? error.message : ''),
      };
    }
  },
};
