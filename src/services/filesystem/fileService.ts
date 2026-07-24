/**
 * Local file storage. Images are written to the device filesystem (Data dir);
 * only the path/uri is kept in SQLite (never huge base64 blobs).
 */
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

const IMAGE_DIR = 'atc_images';
const REPORT_DIR = 'atc_reports';
const BACKUP_DIR = 'atc_backups';

async function ensureDir(dir: string) {
  try {
    await Filesystem.mkdir({ path: dir, directory: Directory.Data, recursive: true });
  } catch {
    /* already exists */
  }
}

export const fileService = {
  IMAGE_DIR, REPORT_DIR, BACKUP_DIR,

  /** Persist a base64 (dataURL or raw) image and return a stored path. */
  async saveImage(base64: string, fileName: string): Promise<string> {
    await ensureDir(IMAGE_DIR);
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    const path = `${IMAGE_DIR}/${fileName}`;
    await Filesystem.writeFile({ path, data, directory: Directory.Data, recursive: true });
    return path;
  },

  /** Read a stored image back as a data URL for display / excel embedding. */
  async readImageAsDataUrl(path: string, mime = 'image/jpeg'): Promise<string> {
    const res = await Filesystem.readFile({ path, directory: Directory.Data });
    return `data:${mime};base64,${res.data}`;
  },

  async readBase64(path: string): Promise<string> {
    const res = await Filesystem.readFile({ path, directory: Directory.Data });
    return res.data as string;
  },

  /** Resolve a stored path to a displayable src (native uses convertFileSrc). */
  async displaySrc(path: string): Promise<string> {
    try {
      if (Capacitor.getPlatform() === 'web') {
        return this.readImageAsDataUrl(path);
      }
      const uri = await Filesystem.getUri({ path, directory: Directory.Data });
      return Capacitor.convertFileSrc(uri.uri);
    } catch {
      return '';
    }
  },

  async deleteFile(path: string): Promise<void> {
    try {
      await Filesystem.deleteFile({ path, directory: Directory.Data });
    } catch {
      /* ignore missing */
    }
  },

  async saveReport(base64: string, fileName: string): Promise<{ path: string; uri: string }> {
    await ensureDir(REPORT_DIR);
    const path = `${REPORT_DIR}/${fileName}`;
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Data, recursive: true });
    const uri = await Filesystem.getUri({ path, directory: Directory.Data });
    return { path, uri: uri.uri };
  },

  async saveBackup(base64: string, fileName: string): Promise<{ path: string; uri: string }> {
    await ensureDir(BACKUP_DIR);
    const path = `${BACKUP_DIR}/${fileName}`;
    await Filesystem.writeFile({ path, data: base64, directory: Directory.Data, recursive: true });
    const uri = await Filesystem.getUri({ path, directory: Directory.Data });
    return { path, uri: uri.uri };
  },

  async writeText(path: string, text: string): Promise<void> {
    await Filesystem.writeFile({ path, data: text, directory: Directory.Data, encoding: Encoding.UTF8, recursive: true });
  },

  async listReports(): Promise<string[]> {
    try {
      await ensureDir(REPORT_DIR);
      const res = await Filesystem.readdir({ path: REPORT_DIR, directory: Directory.Data });
      return res.files.map((f) => f.name);
    } catch {
      return [];
    }
  },

  async statSize(path: string): Promise<number> {
    try {
      const s = await Filesystem.stat({ path, directory: Directory.Data });
      return s.size ?? 0;
    } catch {
      return 0;
    }
  },
};
