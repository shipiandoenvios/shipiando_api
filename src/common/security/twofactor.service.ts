import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Entry {
  enabled: boolean;
  pending?: { code: string; expiresAt: string };
}

export class TwoFactorService {
  private store = new Map<string, Entry>();
  private readonly PERSIST_DIR = join(process.cwd(), 'logs', 'security');
  private readonly PERSIST_FILE = join(this.PERSIST_DIR, 'twofactor.json');

  constructor() {
    this.restore();
  }

  private ensureDir() {
    if (!existsSync(this.PERSIST_DIR))
      mkdirSync(this.PERSIST_DIR, { recursive: true });
  }

  private persist() {
    try {
      this.ensureDir();
      const obj: Record<string, Entry> = {};
      for (const [k, v] of this.store.entries()) obj[k] = v;
      writeFileSync(this.PERSIST_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
      console.warn('Failed to persist 2fa store', e);
    }
  }

  private restore() {
    try {
      if (!existsSync(this.PERSIST_FILE)) return;
      const raw = readFileSync(this.PERSIST_FILE, 'utf8');
      const obj = JSON.parse(raw) as Record<string, Entry>;
      for (const k of Object.keys(obj)) this.store.set(k, obj[k]);
    } catch (e) {
      console.warn('Failed to restore 2fa store', e);
    }
  }

  enableFor(userId: string) {
    const e = this.store.get(userId) || { enabled: false };
    e.enabled = true;
    this.store.set(userId, e);
    this.persist();
  }

  disableFor(userId: string) {
    const e = this.store.get(userId) || { enabled: false };
    e.enabled = false;
    delete e.pending;
    this.store.set(userId, e);
    this.persist();
  }

  isEnabled(userId: string) {
    const e = this.store.get(userId);
    return !!e && !!e.enabled;
  }

  generateCode(userId: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    const e = this.store.get(userId) || ({ enabled: true } as Entry);
    e.pending = { code, expiresAt };
    this.store.set(userId, e);
    this.persist();
    return code;
  }

  verifyCode(userId: string, code: string) {
    const e = this.store.get(userId);
    if (!e || !e.pending) return false;
    if (new Date(e.pending.expiresAt).getTime() < Date.now()) return false;
    return e.pending.code === code;
  }
}

export const twoFactorService = new TwoFactorService();
