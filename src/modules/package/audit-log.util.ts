import {
  logPackageStatusChange,
  PackageAuditEntry,
} from '../../common/logging/audit.logger';

export function logPackageStatusChangeLegacy(entry: PackageAuditEntry) {
  logPackageStatusChange(entry);
}

export { PackageAuditEntry as AuditLogEntry };
