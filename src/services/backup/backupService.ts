/**
 * Local backup & restore. Exports the full dataset (all tables + images +
 * profile + settings) into a single ZIP that never leaves the device unless
 * the user explicitly shares it.
 */
import JSZip from 'jszip';
import { dbManager } from '../database/db';
import { fileService } from '../filesystem/fileService';

const TABLES = [
  'employee_profile', 'client_visits', 'visit_images', 'existing_systems',
  'printer_details', 'inquiry_categories', 'consumable_opportunities',
  'printer_opportunities', 'software_opportunities', 'mobile_app_opportunities',
  'follow_ups',
];

export interface BackupMeta {
  app: string;
  version: string;
  createdAt: string;
  tableCounts: Record<string, number>;
}

export const backupService = {
  async exportZip(onProgress?: (pct: number, label: string) => void): Promise<{ base64: string; fileName: string }> {
    const zip = new JSZip();
    const dataFolder = zip.folder('database')!;
    const imgFolder = zip.folder('images')!;
    const meta: BackupMeta = {
      app: 'ATC FieldConnect',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      tableCounts: {},
    };

    let idx = 0;
    for (const table of TABLES) {
      const rows = await dbManager.query(`SELECT * FROM ${table}`);
      meta.tableCounts[table] = rows.length;
      dataFolder.file(`${table}.json`, JSON.stringify(rows, null, 2));
      idx++;
      onProgress?.(Math.round((idx / TABLES.length) * 60), `Exporting ${table}`);
    }

    // Images referenced by visit_images + printer_details
    const images = await dbManager.query<{ image_path: string }>(
      'SELECT image_path FROM visit_images UNION SELECT image_path FROM printer_details WHERE image_path IS NOT NULL'
    );
    let done = 0;
    for (const { image_path } of images) {
      if (!image_path) continue;
      try {
        const b64 = await fileService.readBase64(image_path);
        const name = image_path.split('/').pop()!;
        imgFolder.file(name, b64, { base64: true });
      } catch {
        /* skip missing */
      }
      done++;
      onProgress?.(60 + Math.round((done / Math.max(images.length, 1)) * 35), 'Exporting images');
    }

    zip.file('metadata.json', JSON.stringify(meta, null, 2));
    const base64 = await zip.generateAsync({ type: 'base64', compression: 'DEFLATE' });
    onProgress?.(100, 'Backup ready');

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    return { base64, fileName: `ATC_FieldConnect_Backup_${stamp}.zip` };
  },

  /** Validate that a zip looks like an ATC backup before restoring. */
  async validate(base64: string): Promise<BackupMeta> {
    const zip = await JSZip.loadAsync(base64, { base64: true });
    const metaFile = zip.file('metadata.json');
    if (!metaFile) throw new Error('Invalid backup: metadata.json missing');
    const meta: BackupMeta = JSON.parse(await metaFile.async('string'));
    if (meta.app !== 'ATC FieldConnect') throw new Error('This backup was not created by ATC FieldConnect');
    return meta;
  },

  /** Restore replaces existing data. The caller must confirm first. */
  async restoreZip(base64: string, onProgress?: (pct: number, label: string) => void): Promise<void> {
    const zip = await JSZip.loadAsync(base64, { base64: true });
    await this.validate(base64);

    // Wipe existing tables
    for (const table of TABLES) {
      await dbManager.run(`DELETE FROM ${table}`);
    }
    onProgress?.(15, 'Cleared existing data');

    let idx = 0;
    for (const table of TABLES) {
      const file = zip.file(`database/${table}.json`);
      if (!file) { idx++; continue; }
      const rows: any[] = JSON.parse(await file.async('string'));
      for (const row of rows) {
        const cols = Object.keys(row);
        const placeholders = cols.map(() => '?').join(',');
        await dbManager.run(
          `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`,
          cols.map((c) => row[c])
        );
      }
      idx++;
      onProgress?.(15 + Math.round((idx / TABLES.length) * 55), `Restoring ${table}`);
    }

    // Restore images
    const imgFolder = zip.folder('images');
    if (imgFolder) {
      const files = Object.values(imgFolder.files).filter((f) => !f.dir);
      let done = 0;
      for (const f of files) {
        const name = f.name.replace('images/', '');
        const b64 = await f.async('base64');
        await fileService.saveImage(b64, name);
        done++;
        onProgress?.(70 + Math.round((done / Math.max(files.length, 1)) * 28), 'Restoring images');
      }
    }
    onProgress?.(100, 'Restore complete');
  },
};
