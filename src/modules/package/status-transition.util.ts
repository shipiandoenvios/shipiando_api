import { PackageStatus } from './dto/create-package.dto';

// Define allowed transitions for each status
export const ALLOWED_STATUS_TRANSITIONS: Record<PackageStatus, PackageStatus[]> = {
  CREATED: ['AWAITING_CHECKIN'],
  AWAITING_CHECKIN: ['AT_ORIGIN', 'IN_WAREHOUSE'],
  AT_ORIGIN: ['IN_WAREHOUSE', 'IN_TRANSIT'],
  IN_WAREHOUSE: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'RETURNED', 'EXCEPTION'],
  DELIVERED: [],
  RETURNED: [],
  EXCEPTION: ['IN_TRANSIT', 'RETURNED'],
};

export function isStatusTransitionAllowed(from: PackageStatus, to: PackageStatus): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
