/**
 * Low-level SQLite connection manager.
 * Uses @capacitor-community/sqlite on-device and the jeep-sqlite web store
 * for the browser preview, so the exact same code path runs everywhere.
 */
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { DB_NAME, SCHEMA_STATEMENTS } from './schema';

class DatabaseManager {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  isReady(): boolean {
    return this.initialized;
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);

    // On web we must initialise the jeep-sqlite web store before use.
    if (Capacitor.getPlatform() === 'web') {
      await customElements.whenDefined('jeep-sqlite');
      await this.sqlite.initWebStore();
    }

    const retCC = (await this.sqlite.checkConnectionsConsistency()).result;
    const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

    if (retCC && isConn) {
      this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
    } else {
      this.db = await this.sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }

    await this.db.open();
    await this.db.execute(SCHEMA_STATEMENTS.join('\n'));

    if (Capacitor.getPlatform() === 'web') {
      await this.sqlite.saveToStore(DB_NAME);
    }
    this.initialized = true;
  }

  private async conn(): Promise<SQLiteDBConnection> {
    // Auto-await initialisation so any repository call is safe even on a
    // deep-link reload where a query may fire before init() has resolved.
    if (!this.initialized) await this.init();
    if (!this.db) throw new Error('Database connection unavailable.');
    return this.db;
  }

  /** Persist to the web IndexedDB-backed store (no-op on native). */
  async persist(): Promise<void> {
    if (Capacitor.getPlatform() === 'web' && this.sqlite) {
      await this.sqlite.saveToStore(DB_NAME);
    }
  }

  async query<T = any>(statement: string, values: any[] = []): Promise<T[]> {
    const conn = await this.conn();
    const res = await conn.query(statement, values);
    return (res.values ?? []) as T[];
  }

  async run(statement: string, values: any[] = []): Promise<{ lastId?: number; changes?: number }> {
    const conn = await this.conn();
    const res = await conn.run(statement, values);
    await this.persist();
    return {
      lastId: res.changes?.lastId,
      changes: res.changes?.changes,
    };
  }

  async execute(statement: string): Promise<void> {
    const conn = await this.conn();
    await conn.execute(statement);
    await this.persist();
  }
}

export const dbManager = new DatabaseManager();
