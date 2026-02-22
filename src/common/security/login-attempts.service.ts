import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface RecordItem {
  attempts: number;
  firstAttemptAt: string;
  lockedUntil?: string;
}

export class LoginAttemptsService {
  private store = new Map<string, RecordItem>();
  private readonly PERSIST_DIR = join(process.cwd(), 'logs', 'security');
  private readonly PERSIST_FILE = join(this.PERSIST_DIR, 'login-attempts.json');
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly lockoutMs: number;

  constructor(
    maxAttempts = 5,
    windowMs = 15 * 60 * 1000,
    lockoutMs = 15 * 60 * 1000,
  ) {
    this.maxAttempts =
      Number(process.env.AUTH_MAX_LOGIN_ATTEMPTS) || maxAttempts;
    this.windowMs = Number(process.env.AUTH_LOGIN_WINDOW_MS) || windowMs;
    this.lockoutMs = Number(process.env.AUTH_LOCKOUT_MS) || lockoutMs;
    this.restore();
  }

  private ensureDir() {
    if (!existsSync(this.PERSIST_DIR))
      mkdirSync(this.PERSIST_DIR, { recursive: true });
  }
  private persist() {
    try {
      this.ensureDir();
      const obj: Record<string, RecordItem> = {};
      for (const [k, v] of this.store.entries()) obj[k] = v;
      writeFileSync(this.PERSIST_FILE, JSON.stringify(obj, null, 2));
    } catch (e) {
      // non-fatal
      console.warn('Failed to persist login attempts store', e);
    }
  }
  private restore() {
    try {
      if (!existsSync(this.PERSIST_FILE)) return;
      const raw = readFileSync(this.PERSIST_FILE, 'utf8');
      const obj = JSON.parse(raw) as Record<string, RecordItem>;
      for (const k of Object.keys(obj)) this.store.set(k, obj[k]);
    } catch (e) {
      console.warn('Failed to restore login attempts store', e);
    }
  }

  recordFailure(key: string) {
    const now = Date.now();
    const s = this.store.get(key);
    if (!s) {
      this.store.set(key, {
        attempts: 1,
        firstAttemptAt: new Date(now).toISOString(),
      });
      this.persist();
      return;
    }
    // reset window
    if (now - new Date(s.firstAttemptAt).getTime() > this.windowMs) {
      s.attempts = 1;
      s.firstAttemptAt = new Date(now).toISOString();
      delete s.lockedUntil;
      this.store.set(key, s);
      this.persist();
      return;
    }

    s.attempts += 1;
    if (s.attempts >= this.maxAttempts) {
      s.lockedUntil = new Date(now + this.lockoutMs).toISOString();
    }
    this.store.set(key, s);
    this.persist();
  }

  reset(key: string) {
    this.store.delete(key);
    this.persist();
  }

  isLocked(key: string): {
    locked: boolean;
    lockedUntil?: string;
    attempts?: number;
  } {
    const s = this.store.get(key);
    if (!s) return { locked: false, attempts: 0 };
    if (s.lockedUntil && new Date(s.lockedUntil).getTime() > Date.now())
      return { locked: true, lockedUntil: s.lockedUntil, attempts: s.attempts };
    // not locked
    return { locked: false, attempts: s.attempts };
  }
}

export const loginAttemptsService = new LoginAttemptsService();
