import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization;
    if (!auth) {
      throw new UnauthorizedException('No authorization header');
    }
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid authorization format');
    }
    const token = parts[1];
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
