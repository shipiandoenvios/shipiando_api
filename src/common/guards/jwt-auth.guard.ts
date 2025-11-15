import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
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
  const decoded = jwt.verify(token, secret) as any;
      // expected decoded to contain id and roles
      req.user = decoded;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
