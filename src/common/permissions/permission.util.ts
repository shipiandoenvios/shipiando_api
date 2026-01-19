import { ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

export type AppUser =
  | { id?: string; roles?: string[]; clientId?: string; email?: string }
  | undefined
  | null;

export interface RequestWithUser extends Request {
  user?: AppUser;
  clientId?: string;
}

export function assertHasAnyRole(user: AppUser, allowed: string[]) {
  if (!user || !Array.isArray(user.roles)) {
    throw new ForbiddenException('No autorizado');
  }
  const has = user.roles.some((r) => allowed.includes(r));
  if (!has) throw new ForbiddenException('No autorizado');
}

export function assertClientMatches(user: AppUser, clientId?: string) {
  if (!user) return;
  if (!Array.isArray(user.roles)) return;
  if (user.roles.includes('CLIENT')) {
    const uClient = 'clientId' in user ? user.clientId : undefined;
    if (!uClient)
      throw new ForbiddenException('No autorizado para este recurso');
    if (clientId && clientId !== uClient)
      throw new ForbiddenException('No autorizado para este recurso');
  }
}
