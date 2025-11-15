import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface AuditLogEntry {
  timestamp: string;
  userId: string | null;
  packageId: string;
  previousStatus: string;
  newStatus: string;
  ip?: string;
  userAgent?: string;
}

const AUDIT_DIR = join(process.cwd(), 'logs');
const AUDIT_FILE = join(AUDIT_DIR, 'package-status-audit.log');

export function logPackageStatusChange(entry: AuditLogEntry) {
  if (!existsSync(AUDIT_DIR)) mkdirSync(AUDIT_DIR);
  const line = JSON.stringify(entry) + '\n';
  appendFileSync(AUDIT_FILE, line, { encoding: 'utf8' });
}
