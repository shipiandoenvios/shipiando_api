import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface StoredResponse {
  statusCode: number;
  body: unknown;
  createdAt: string;
}

export class IdempotencyService {
  private store = new Map<string, StoredResponse | 'processing'>();
  private readonly PERSIST_DIR = join(process.cwd(), 'logs', 'idempotency');
  private readonly PERSIST_FILE = join(this.PERSIST_DIR, 'store.json');

  constructor(private ttlMs = 24 * 60 * 60 * 1000) {
    this.restore();
  }

  private ensureDir() {
    if (!existsSync(this.PERSIST_DIR))
      mkdirSync(this.PERSIST_DIR, { recursive: true });
  }

  private persist() {
    try {
      this.ensureDir();
      const obj: Record<string, StoredResponse | null> = {};
      for (const [k, v] of this.store.entries()) {
        if (v === 'processing') continue;
        obj[k] = v;
      }
      writeFileSync(this.PERSIST_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
      // non-fatal

      console.warn('Failed to persist idempotency store', e);
    }
  }

  private restore() {
    try {
      if (!existsSync(this.PERSIST_FILE)) return;
      const raw = readFileSync(this.PERSIST_FILE, 'utf-8');
      const obj = JSON.parse(raw) as Record<string, StoredResponse>;
      for (const k of Object.keys(obj)) {
        const v = obj[k];
        // respect TTL
        if (new Date(v.createdAt).getTime() + this.ttlMs > Date.now())
          this.store.set(k, v);
      }
    } catch (e) {
      console.warn('Failed to restore idempotency store', e);
    }
  }

  isProcessing(key: string) {
    return this.store.get(key) === 'processing';
  }

  has(key: string) {
    const v = this.store.get(key);
    return v !== undefined && v !== 'processing';
  }

  get(key: string): StoredResponse | null {
    const v = this.store.get(key);
    if (!v || v === 'processing') return null;
    // TTL check
    if (new Date(v.createdAt).getTime() + this.ttlMs < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return v;
  }

  startProcessing(key: string): boolean {
    if (this.store.has(key)) return false;
    this.store.set(key, 'processing');
    return true;
  }

  complete(key: string, statusCode: number, body: unknown) {
    const entry: StoredResponse = {
      statusCode,
      body,
      createdAt: new Date().toISOString(),
    };
    this.store.set(key, entry);
    // persist asynchronously
    setImmediate(() => this.persist());
  }
}

export const idempotencyService = new IdempotencyService();
