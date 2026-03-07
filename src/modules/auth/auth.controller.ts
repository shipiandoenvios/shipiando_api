import {
  Body,
  Controller,
  Post,
  Res,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { twoFactorService } from '../../common/security/twofactor.service';
import { loginAttemptsService } from '../../common/security/login-attempts.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('2fa/verify')
  async verify2fa(
    @Body() body: { email: string; code: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, code } = body;
    const user = await this.authService.validateUser(email, '');
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const verified = twoFactorService.verifyCode(user.id, code);
    if (!verified) throw new UnauthorizedException('Invalid 2FA code');
    const { accessToken, refreshToken } = await this.authService.login(user);
    const secure = process.env.NODE_ENV === 'production';
    const accessMaxAge =
      Number(process.env.AUTH_ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000;
    const refreshMaxAge =
      Number(process.env.AUTH_REFRESH_TOKEN_MAX_AGE_MS) ||
      7 * 24 * 60 * 60 * 1000;
    const accessCookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
    const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';
    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: accessMaxAge,
      path: '/',
    });
    const refreshCookieNameEnv =
      process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
    res.cookie(refreshCookieNameEnv, refreshToken, {
      httpOnly: true,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: refreshMaxAge,
      path: '/',
    });
    return { success: true };
  }

  @Post('register')
  @HttpCode(201)
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.register(
      body,
    );

    const secure = process.env.NODE_ENV === 'production';
    const accessMaxAge =
      Number(process.env.AUTH_ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000;
    const refreshMaxAge =
      Number(process.env.AUTH_REFRESH_TOKEN_MAX_AGE_MS) ||
      7 * 24 * 60 * 60 * 1000;

    const accessCookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
    const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';
    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: accessMaxAge,
      path: '/',
    });

    const refreshCookieName =
      process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
    res.cookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: refreshMaxAge,
      path: '/',
    });

    const csrfCookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
    const csrfToken = randomBytes(48).toString('hex');
    res.cookie(csrfCookieName, csrfToken, {
      httpOnly: false,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: refreshMaxAge,
      path: '/',
    });

    return { success: true, token: accessToken, user };
  }

  @Post('login')
  @HttpCode(200)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
  @Throttle({ limit: 5, ttl: 60 } as unknown as any)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;

    const lockedInfo = loginAttemptsService?.isLocked(email) ?? {
      locked: false,
    };
    if (lockedInfo.locked) {
      throw new UnauthorizedException('Account locked. Try again later');
    }

    const user = await this.authService.validateUser(email, password);
    if (!user) {
      try {
        loginAttemptsService.recordFailure(email);
      } catch {
        /* non-fatal */
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    try {
      loginAttemptsService.reset(email);
    } catch {
      // ignore cookie errors
    }

    if (twoFactorService.isEnabled(user.id)) {
      twoFactorService.generateCode(user.id);
      return {
        success: true,
        nextStep: 'verify_2fa',
        message: '2FA code sent',
      };
    }

    const { accessToken, refreshToken } = await this.authService.login(user);

    const secure = process.env.NODE_ENV === 'production';
    const accessMaxAge =
      Number(process.env.AUTH_ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000;
    const refreshMaxAge =
      Number(process.env.AUTH_REFRESH_TOKEN_MAX_AGE_MS) ||
      7 * 24 * 60 * 60 * 1000;

    const accessCookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
    const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';
    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: accessMaxAge,
      path: '/',
    });

    const refreshCookieName =
      process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
    res.cookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: refreshMaxAge,
      path: '/',
    });

    const csrfCookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
    const csrfToken = randomBytes(48).toString('hex');
    res.cookie(csrfCookieName, csrfToken, {
      httpOnly: false,
      secure: sameSite === 'none' ? true : secure,
      sameSite,
      maxAge: refreshMaxAge,
      path: '/',
    });

    return { success: true, user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const cookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
    const refreshCookieName =
      process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
    const csrfCookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
    res.clearCookie(cookieName, { path: '/' });
    res.clearCookie(refreshCookieName, { path: '/' });
    res.clearCookie(csrfCookieName, { path: '/' });
    return { success: true };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Res({ passthrough: true }) res: Response) {
    const refreshCookieName =
      process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
    const cookies =
      (res.req as { cookies?: Record<string, string> }).cookies ?? {};
    const refreshToken = cookies[refreshCookieName];
    if (!refreshToken) {
      return { success: false, message: 'No refresh token' };
    }

    try {
      const {
        accessToken,
        refreshToken: newRefreshToken,
        user,
      } = await this.authService.refreshTokens(refreshToken);

      const secure = process.env.NODE_ENV === 'production';
      const accessMaxAge =
        Number(process.env.AUTH_ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000;
      const refreshMaxAge =
        Number(process.env.AUTH_REFRESH_TOKEN_MAX_AGE_MS) ||
        7 * 24 * 60 * 60 * 1000;

      const accessCookieName =
        process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
      const sameSite = (process.env.COOKIE_SAMESITE as 'lax' | 'strict' | 'none') || 'lax';
      res.cookie(accessCookieName, accessToken, {
        httpOnly: true,
        secure: sameSite === 'none' ? true : secure,
        sameSite,
        maxAge: accessMaxAge,
        path: '/',
      });

      const refreshCookieNameEnv =
        process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
      res.cookie(refreshCookieNameEnv, newRefreshToken, {
        httpOnly: true,
        secure: sameSite === 'none' ? true : secure,
        sameSite,
        maxAge: refreshMaxAge,
        path: '/',
      });

      const csrfCookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
      const csrfToken = randomBytes(48).toString('hex');
      res.cookie(csrfCookieName, csrfToken, {
        httpOnly: false,
        secure: sameSite === 'none' ? true : secure,
        sameSite,
        maxAge: refreshMaxAge,
        path: '/',
      });

      return { success: true, user };
    } catch {
      return { success: false, message: 'Invalid refresh token' };
    }
  }
}
