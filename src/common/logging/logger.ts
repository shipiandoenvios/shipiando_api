import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { LoggerService } from '@nestjs/common';

// Minimal runtime type for winston-like APIs to avoid compile-time dependency
type WinstonLike = {
  format: {
    combine: (...args: unknown[]) => unknown;
    timestamp: (...args: unknown[]) => unknown;
    printf: (fn: (info: Record<string, unknown>) => string) => unknown;
    json: (...args: unknown[]) => unknown;
  };
  transports: {
    Console: new (...args: unknown[]) => object;
    File: new (...args: unknown[]) => object;
  };
  createLogger: (opts: unknown) => {
    log: (
      info: { level: string; message: string } & Record<string, unknown>,
    ) => void;
  };
};

function isWinstonLike(obj: unknown): obj is WinstonLike {
  if (!obj || typeof obj !== 'object') return false;
  const anyObj = obj as Record<string, unknown>;
  return (
    typeof anyObj.format === 'object' &&
    !!(anyObj.format as Record<string, unknown>).combine &&
    !!(anyObj.format as Record<string, unknown>).timestamp &&
    !!(anyObj.format as Record<string, unknown>).printf &&
    !!(anyObj.format as Record<string, unknown>).json &&
    typeof anyObj.transports === 'object' &&
    !!(anyObj.transports as Record<string, unknown>).Console &&
    !!(anyObj.transports as Record<string, unknown>).File &&
    typeof anyObj.createLogger === 'function'
  );
}

// Resilient logger: prefer winston if installed; otherwise fallback to console with structured JSON
let winston: WinstonLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const raw = require('winston') as unknown;
  winston = isWinstonLike(raw) ? raw : null;
} catch {
  winston = null;
}

const LOG_DIR = join(process.cwd(), 'logs');
function ensureLogDir() {
  if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
}

if (winston) {
  ensureLogDir();
}

export class AppLogger implements LoggerService {
  private transport: {
    log: (
      info: { level: string; message: string } & Record<string, unknown>,
    ) => void;
  } | null = null;

  constructor() {
    if (winston) {
      const { combine, timestamp, printf, json } = winston.format;
      const simpleFormat = printf(
        ({
          level,
          message,
          timestamp: ts,
          ...meta
        }: Record<string, unknown>) => {
          const metaObj = meta as Record<string, unknown>;
          const metaStr =
            metaObj && Object.keys(metaObj).length
              ? ` ${JSON.stringify(metaObj)}`
              : '';
          const msg =
            typeof message === 'string' ? message : JSON.stringify(message);
          return `${String(ts)} ${String(level)}: ${msg}${metaStr}`;
        },
      );

      this.transport = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        format: (combine as (...args: unknown[]) => unknown)(
          timestamp(),
          json(),
        ),
        transports: [
          new winston.transports.Console({
            format: (combine as (...args: unknown[]) => unknown)(
              timestamp(),
              simpleFormat,
            ),
          }),
          new winston.transports.File({
            filename: join(LOG_DIR, 'app.log'),
            format: (combine as (...args: unknown[]) => unknown)(
              timestamp(),
              json(),
            ),
          }),
        ],
      });
    }
  }

  log(
    message: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) {
    this.write('info', message, meta);
  }
  error(
    message: string | Record<string, unknown>,
    trace?: string,
    meta?: Record<string, unknown>,
  ) {
    const payload = meta ? { trace, ...meta } : { trace };
    this.write('error', message, payload);
  }
  warn(
    message: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) {
    this.write('warn', message, meta);
  }
  debug(
    message: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) {
    this.write('debug', message, meta);
  }
  verbose(
    message: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) {
    this.write('verbose', message, meta);
  }

  private write(
    level: string,
    message: string | Record<string, unknown>,
    meta?: Record<string, unknown>,
  ) {
    const messageStr =
      typeof message === 'string' ? message : JSON.stringify(message);

    if (this.transport) {
      const payload = meta
        ? { level, message: messageStr, ...meta }
        : { level, message: messageStr };
      this.transport.log(payload);
    } else {
      // fallback to structured console output - emit only the message string, not the entire payload
      console.log(messageStr);
    }
  }
}

// convenience default instance
export const logger = new AppLogger();
