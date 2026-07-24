/**
 * Bridge between the (non-React) camera service and the React web-camera UI.
 *
 * On a device the Capacitor Camera plugin opens the native camera. In a browser
 * the plugin falls back to a file picker, which is not a camera at all — so on
 * web we drive `getUserMedia` through a real in-app capture modal instead.
 * The modal registers its opener here at mount; the service calls it.
 */

/** Resolves to a JPEG data URL, or null if the user cancelled. */
export type WebCameraOpener = () => Promise<string | null>;

let opener: WebCameraOpener | null = null;

export const webCamera = {
  register(fn: WebCameraOpener): void {
    opener = fn;
  },
  unregister(): void {
    opener = null;
  },
  /** True when this browser can stream from a camera and the UI is mounted. */
  isAvailable(): boolean {
    return (
      opener !== null &&
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  },
  /** Browser supports camera streaming, regardless of UI mount state. */
  isSupported(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
    );
  },
  async capture(): Promise<string | null> {
    if (!opener) return null;
    return opener();
  },
};
