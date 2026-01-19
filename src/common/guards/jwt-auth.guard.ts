import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { PrismaService } from 'src/prisma/prisma.service';

interface JwtPayload {
  id: string;
  email?: string;
  roleId?: string;
  clientId?: string;
}

interface RequestWithUser {
  user?: {
    id: string;
    email?: string;
    roles: string[];
    role: string | null;
    clientId?: string;
  };
  headers?: { authorization?: string };
  cookies?: Record<string, string>;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<RequestWithUser>();
    // Try Authorization header first, then fallback to cookie
    let token: string | undefined;
    const authHeader = req.headers?.authorization;
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      const cookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
      // req.cookies is available if cookie-parser middleware is used
      token = req.cookies?.[cookieName];
    }

    if (!token) {
      throw new UnauthorizedException('No authorization token');
    }
    try {
      const secret = process.env.JWT_SECRET || 'dev-jwt-secret';
      const decoded = jwt.verify(token, secret) as JwtPayload;
      // expected decoded to contain id and roleId
      // Build req.user with unified roles[]
      const baseUser: {
        id: string;
        email?: string;
        roles: string[];
        role: string | null;
        clientId?: string;
      } = { id: decoded.id, email: decoded.email, roles: [], role: null };
      // role alias mapping in case older names exist
      const ROLE_ALIAS: Record<string, string> = {
        SUPER_ADMIN: 'ADMIN',
        ACCOUNTANT: 'ADMIN',
        ENCARGADO: 'ADMIN',
        ADMINISTRATIVO: 'ADMIN',
        ANALISTA: 'ADMIN',
        EMPRESA: 'CLIENT',
        EMPLOYEE: 'USER',
        ADMIN: 'ADMIN',
        CLIENT: 'CLIENT',
        USER: 'USER',
        WAREHOUSE: 'WAREHOUSE',
        CARRIER: 'CARRIER',
        STORE: 'STORE',
      };
      const roles: string[] = [];
      if (decoded.roleId) {
        try {
          const role = await this.prisma.role.findUnique({
            where: { id: decoded.roleId },
          });
          if (role?.name) {
            const normalized =
              ROLE_ALIAS[role.name.toUpperCase()] || role.name.toUpperCase();
            roles.push(normalized);
          }
        } catch {
          // ignore DB errors - allow authentication to succeed but without role
        }
      }
      baseUser.roles = roles;
      baseUser.role = roles.length ? roles[0] : null;
      // propagate clientId from token if present
      if (decoded.clientId) {
        baseUser.clientId = decoded.clientId;
      }

      req.user = baseUser;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
