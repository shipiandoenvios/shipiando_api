import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

type JWTPayload = { id: string; email: string; roleId?: string };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    // remove sensitive fields
    const { passwordHash, ...rest } = user as any;
    return rest;
  }

  async login(user: any) {
    const payload: JWTPayload = { id: user.id, email: user.email, roleId: user.roleId };
    const secret = (process.env.JWT_SECRET || 'dev-jwt-secret') as jwt.Secret;
    const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

    const accessToken = jwt.sign(payload, secret, { expiresIn: accessExpiresIn } as jwt.SignOptions);
    const refreshToken = jwt.sign(payload, secret, { expiresIn: refreshExpiresIn } as jwt.SignOptions);
    return { accessToken, refreshToken, user };
  }

  async refreshTokens(refreshToken: string) {
    const secret = (process.env.JWT_SECRET || 'dev-jwt-secret') as jwt.Secret;
    try {
      const decoded = jwt.verify(refreshToken, secret) as JWTPayload & { iat?: number; exp?: number };
      // Issue new tokens
      const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
      const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
      const accessToken = jwt.sign({ id: decoded.id, email: decoded.email, roleId: decoded.roleId }, secret, {
        expiresIn: accessExpiresIn,
      } as jwt.SignOptions);
      const newRefreshToken = jwt.sign({ id: decoded.id, email: decoded.email, roleId: decoded.roleId }, secret, {
        expiresIn: refreshExpiresIn,
      } as jwt.SignOptions);

      // Optionally, you could validate that the user still exists and is active
      const user = await this.prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) throw new UnauthorizedException('Invalid refresh token');

      const { passwordHash, ...rest } = user as any;
      return { accessToken, refreshToken: newRefreshToken, user: rest };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
