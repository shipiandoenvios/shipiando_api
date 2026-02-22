import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const AUDIT_DIR = join(process.cwd(), 'logs');

function ensureDir() {
  if (!existsSync(AUDIT_DIR)) mkdirSync(AUDIT_DIR, { recursive: true });
}

function writeAuditLog(fileName: string, payload: unknown) {
  ensureDir();
  const line = JSON.stringify(payload) + '\n';
  appendFileSync(join(AUDIT_DIR, fileName), line, { encoding: 'utf8' });
}

export interface PackageAuditEntry {
  timestamp: string;
  userId?: string | null;
  packageId: string;
  previousStatus?: string;
  newStatus?: string;
  ip?: string;
  userAgent?: string;
  clientId?: string | null;
}

export interface TrackingAuditEntry {
  timestamp: string;
  userId?: string | null;
  trackingEventId: string;
  shipmentId?: string;
  code?: string;
  type?: string;
  description?: string;
  eventAt?: string | null;
  clientId?: string | null;
}

export interface RoleAuditEntry {
  timestamp: string;
  userId?: string | null;
  roleId?: string;
  action: 'create' | 'update' | 'delete';
  before?: unknown;
  after?: unknown;
}

export function logPackageStatusChange(entry: PackageAuditEntry) {
  writeAuditLog('package-status-audit.log', entry);
}

export function logTrackingEvent(entry: TrackingAuditEntry) {
  writeAuditLog('tracking-event-audit.log', entry);
}

export function logRoleChange(entry: RoleAuditEntry) {
  writeAuditLog('role-change-audit.log', entry);
}

export interface PolicyAuditEntry {
  timestamp: string;
  userId?: string | null;
  action: string;
  resource?: string | null;
  attrs?: Record<string, unknown> | null;
  reason?: string | null;
  clientId?: string | null;
}

export function logPolicyDenial(entry: PolicyAuditEntry) {
  writeAuditLog('policy-denials.log', entry);
}

export interface PolicyChangeEntry {
  timestamp: string;
  userId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
}

export function logPolicyChange(entry: PolicyChangeEntry) {
  writeAuditLog('policy-changes.log', entry);
}
