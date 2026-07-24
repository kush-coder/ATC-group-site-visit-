/**
 * File / text sharing through the OS share sheet (WhatsApp, Email, Drive, etc.).
 */
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const shareService = {
  async shareFile(uri: string, title: string, text: string): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      // Web preview cannot open a native share sheet for a file URI.
      throw new Error('Sharing is available on the mobile device build.');
    }
    await Share.share({ title, text, url: uri, dialogTitle: title });
  },

  async shareText(title: string, text: string): Promise<void> {
    try {
      await Share.share({ title, text, dialogTitle: title });
    } catch {
      /* user cancelled */
    }
  },

  /** Trigger a browser download (used in web preview builds). */
  downloadBase64(base64: string, fileName: string, mime: string): void {
    const link = document.createElement('a');
    link.href = `data:${mime};base64,${base64}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};
