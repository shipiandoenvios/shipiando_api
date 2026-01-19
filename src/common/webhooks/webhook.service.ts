import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const OUT_DIR = join(process.cwd(), 'logs', 'webhooks');
function ensureDir() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class WebhookService {
  async send(
    url: string,
    payload: unknown,
    opts?: { maxRetries?: number; initialDelayMs?: number },
  ) {
    ensureDir();
    const maxRetries = opts?.maxRetries ?? 3;
    const initialDelay = opts?.initialDelayMs ?? 500; // ms
    let attempt = 0;
    let lastError: unknown = null;

    while (attempt <= maxRetries) {
      try {
        attempt++;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        const record = {
          timestamp: new Date().toISOString(),
          url,
          attempt,
          status: res.status,
          response: text,
        };
        appendFileSync(
          join(OUT_DIR, 'outgoing.log'),
          JSON.stringify(record) + '\n',
        );
        if (res.ok) return { status: res.status, body: text };
        lastError = new Error(`Non-OK status ${res.status}`);
      } catch (e) {
        lastError = e;
        appendFileSync(
          join(OUT_DIR, 'outgoing.log'),
          JSON.stringify({
            timestamp: new Date().toISOString(),
            url,
            attempt,
            status: 'error',
            error: String(e),
          }) + '\n',
        );
      }

      // backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Failed to deliver webhook');
  }
}

export const webhookService = new WebhookService();
