/**
 * File / text sharing.
 *
 * On a device this goes through the OS share sheet (WhatsApp, Email, Drive,
 * Bluetooth, file manager). In a browser it uses the Web Share API when the
 * browser can share files — which gives a genuine share sheet on Android
 * Chrome and iOS Safari — and falls back to a direct download elsewhere
 * (typically desktop), so the user always ends up with the file.
 */
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { fileService } from '../filesystem/fileService';

export type DeliveryMethod = 'share-sheet' | 'web-share' | 'download';

export interface DeliveryResult {
  method: DeliveryMethod;
  /** True when the user dismissed the share sheet without choosing a target. */
  cancelled: boolean;
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException ? e.name === 'AbortError' : (e as Error)?.name === 'AbortError';
}

export const shareService = {
  /** Can this browser put an actual file into a share sheet? */
  canWebShareFile(fileName = 'f.xlsx', mime = 'application/octet-stream'): boolean {
    try {
      if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false;
      const probe = new File([new Blob([''], { type: mime })], fileName, { type: mime });
      return navigator.canShare({ files: [probe] });
    } catch {
      return false;
    }
  },

  /**
   * Deliver a generated file to the user by the best route the platform offers.
   * Never throws for an ordinary cancel — inspect `cancelled` on the result.
   */
  async deliverFile(opts: {
    base64: string;
    fileName: string;
    mime: string;
    title: string;
    text: string;
    /** Pre-saved native uri, if the caller already wrote the file. */
    uri?: string;
    /** Where to persist on device: reports or backups. */
    target?: 'report' | 'backup';
  }): Promise<DeliveryResult> {
    const { base64, fileName, mime, title, text, target = 'report' } = opts;

    if (Capacitor.getPlatform() !== 'web') {
      const uri =
        opts.uri ??
        (target === 'backup'
          ? (await fileService.saveBackup(base64, fileName)).uri
          : (await fileService.saveReport(base64, fileName)).uri);
      try {
        await Share.share({ title, text, url: uri, dialogTitle: title });
        return { method: 'share-sheet', cancelled: false };
      } catch (e) {
        if (isAbortError(e)) return { method: 'share-sheet', cancelled: true };
        throw e;
      }
    }

    // Web: prefer a real share sheet, fall back to downloading the file.
    if (this.canWebShareFile(fileName, mime)) {
      try {
        const file = new File([base64ToBlob(base64, mime)], fileName, { type: mime });
        await navigator.share({ files: [file], title, text });
        return { method: 'web-share', cancelled: false };
      } catch (e) {
        if (isAbortError(e)) return { method: 'web-share', cancelled: true };
        // Anything else (permission, unsupported target) -> still give them the file.
      }
    }
    this.downloadBase64(base64, fileName, mime);
    return { method: 'download', cancelled: false };
  },

  async shareText(title: string, text: string): Promise<void> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({ title, text });
        }
        return;
      }
      await Share.share({ title, text, dialogTitle: title });
    } catch {
      /* user cancelled */
    }
  },

  /** Trigger a browser download. */
  downloadBase64(base64: string, fileName: string, mime: string): void {
    const url = URL.createObjectURL(base64ToBlob(base64, mime));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  },
};
