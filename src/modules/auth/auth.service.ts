import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

type JWTPayload = { id: string; email: string; roleId?: string };
type ValidatedUser = {
  id: string;
  email: string;
  roleId?: string | null;
  clientId?: string | null;
  role?: string;
  roles?: string[];
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user) return null;

    const compareFn = (
      bcrypt as { compare: (data: string, hash: string) => Promise<boolean> }
    ).compare;
    const valid = await compareFn(password, String(user.passwordHash));
    if (!valid) return null;

    // remove sensitive fields and include role names
    const rest = { ...user } as Record<string, unknown>;
    delete (rest as { passwordHash?: unknown }).passwordHash;
    const roleName = user.role?.name;
    return {
      ...(rest as typeof user),
      role: roleName,
      roles: roleName ? [roleName] : [],
    };
  }

  async login(user: ValidatedUser) {
    await Promise.resolve();
    const payload: JWTPayload & { clientId?: string | null } = {
      id: user.id,
      email: user.email,
      roleId: user.roleId ?? undefined,
      clientId: user.clientId ?? undefined,
    };
    const secret = (process.env.JWT_SECRET || 'dev-jwt-secret') as jwt.Secret;
    const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    const accessToken = jwt.sign(payload, secret, {
      expiresIn: accessExpiresIn,
    } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, secret, {
      expiresIn: refreshExpiresIn,
    } as jwt.SignOptions);
    return { accessToken, refreshToken, user };
  }

  async refreshTokens(refreshToken: string) {
    const secret = (process.env.JWT_SECRET || 'dev-jwt-secret') as jwt.Secret;
    try {
      const decoded = jwt.verify(refreshToken, secret) as JWTPayload & {
        iat?: number;
        exp?: number;
        clientId?: string;
      };
      // Issue new tokens
      const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
      const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
      const accessToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          roleId: decoded.roleId,
          clientId: decoded.clientId,
        },
        secret,
        {
          expiresIn: accessExpiresIn,
        } as jwt.SignOptions,
      );
      const newRefreshToken = jwt.sign(
        {
          id: decoded.id,
          email: decoded.email,
          roleId: decoded.roleId,
          clientId: decoded.clientId,
        },
        secret,
        {
          expiresIn: refreshExpiresIn,
        } as jwt.SignOptions,
      );

      // Optionally, you could validate that the user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.id },
        include: { role: true },
      });
      if (!user) throw new UnauthorizedException('Invalid refresh token');

      const rest = { ...user } as Record<string, unknown>;
      delete (rest as { passwordHash?: unknown }).passwordHash;
      const roleName = user?.role?.name;
      const userWithRole = {
        ...(rest as typeof user),
        role: roleName,
        roles: roleName ? [roleName] : [],
      };
      return { accessToken, refreshToken: newRefreshToken, user: userWithRole };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
