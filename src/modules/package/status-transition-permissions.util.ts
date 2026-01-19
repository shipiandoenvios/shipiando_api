import { ForbiddenException } from '@nestjs/common';

// Define which roles can perform each transition (from -> to)
export const STATUS_TRANSITION_ROLE_MAP: Record<string, string[]> = {
  'CREATED:AWAITING_CHECKIN': ['WAREHOUSE', 'STORE', 'ADMIN'],
  'AWAITING_CHECKIN:AT_ORIGIN': ['WAREHOUSE', 'CARRIER', 'ADMIN'],
  'AWAITING_CHECKIN:IN_WAREHOUSE': ['WAREHOUSE', 'ADMIN'],
  'AT_ORIGIN:IN_WAREHOUSE': ['WAREHOUSE', 'ADMIN'],
  'AT_ORIGIN:IN_TRANSIT': ['CARRIER', 'ADMIN'],
  'IN_WAREHOUSE:IN_TRANSIT': ['CARRIER', 'WAREHOUSE', 'ADMIN'],
  'IN_WAREHOUSE:OUT_FOR_DELIVERY': ['CARRIER', 'WAREHOUSE', 'ADMIN'],
  'IN_TRANSIT:OUT_FOR_DELIVERY': ['CARRIER', 'ADMIN'],
  'IN_TRANSIT:DELIVERED': ['CARRIER', 'ADMIN'],
  'IN_TRANSIT:EXCEPTION': ['CARRIER', 'ADMIN'],
  'OUT_FOR_DELIVERY:DELIVERED': ['CARRIER', 'ADMIN'],
  'OUT_FOR_DELIVERY:RETURNED': ['CARRIER', 'ADMIN'],
  'OUT_FOR_DELIVERY:EXCEPTION': ['CARRIER', 'ADMIN'],
  'EXCEPTION:IN_TRANSIT': ['CARRIER', 'ADMIN'],
  'EXCEPTION:RETURNED': ['CARRIER', 'ADMIN'],
};

export function allowedRolesForTransition(from: string, to: string): string[] {
  return STATUS_TRANSITION_ROLE_MAP[`${from}:${to}`] ?? [];
}

export function assertCanTransition(
  user: { roles?: string[] } | undefined | null,
  from: string,
  to: string,
) {
  const allowed = allowedRolesForTransition(from, to);
  if (allowed.length === 0) {
    // No allowed roles defined (either invalid transition or final state)
    throw new ForbiddenException(`Transición no permitida: ${from} → ${to}`);
  }
  if (!user || !Array.isArray(user.roles)) {
    throw new ForbiddenException(
      'No autorizado para realizar la transición de estado',
    );
  }
  const has = user.roles.some((r) => allowed.includes(r));
  if (!has)
    throw new ForbiddenException(
      'No autorizado para realizar la transición de estado',
    );
}
