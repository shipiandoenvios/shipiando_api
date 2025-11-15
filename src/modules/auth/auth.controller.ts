import { Body, Controller, Post, Res, HttpCode } from '@nestjs/common';
import { Response } from 'express';
import { randomBytes } from 'crypto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { email, password } = body;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      return { success: false, message: 'Invalid credentials' };
    }

    const { accessToken, refreshToken } = await this.authService.login(user);

    // Cookie options
    const secure = process.env.NODE_ENV === 'production';
    const accessMaxAge = Number(process.env.AUTH_ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000; // 15 minutes
    const refreshMaxAge = Number(process.env.AUTH_REFRESH_TOKEN_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000; // 7 days

    // Set access token cookie (HttpOnly)
    const accessCookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
    res.cookie(accessCookieName, accessToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: accessMaxAge,
      path: '/',
    });

    // Set refresh token cookie (HttpOnly)
    const refreshCookieName = process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
    res.cookie(refreshCookieName, refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: refreshMaxAge,
      path: '/',
    });

    // Set CSRF double-submit cookie (readable by client JS)
    const csrfCookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
    const csrfToken = randomBytes(48).toString('hex');
    res.cookie(csrfCookieName, csrfToken, {
      httpOnly: false,
      secure,
      sameSite: 'lax',
      maxAge: refreshMaxAge,
      path: '/',
    });

    // Return minimal payload
    return { success: true, user };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
  const cookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
  const refreshCookieName = process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
  const csrfCookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
  // Clear cookies
  res.clearCookie(cookieName, { path: '/' });
  res.clearCookie(refreshCookieName, { path: '/' });
  res.clearCookie(csrfCookieName, { path: '/' });
    return { success: true };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Res({ passthrough: true }) res: Response) {
    const refreshCookieName = process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
    const refreshToken = (res.req as any)?.cookies?.[refreshCookieName];
    if (!refreshToken) {
      return { success: false, message: 'No refresh token' };
    }

    try {
      const { accessToken, refreshToken: newRefreshToken, user } = await this.authService.refreshTokens(refreshToken);

      const secure = process.env.NODE_ENV === 'production';
      const accessMaxAge = Number(process.env.AUTH_ACCESS_TOKEN_MAX_AGE_MS) || 15 * 60 * 1000;
      const refreshMaxAge = Number(process.env.AUTH_REFRESH_TOKEN_MAX_AGE_MS) || 7 * 24 * 60 * 60 * 1000;

      const accessCookieName = process.env.AUTH_COOKIE_NAME || 'sopy-auth-token';
      res.cookie(accessCookieName, accessToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: accessMaxAge, path: '/' });

      const refreshCookieNameEnv = process.env.AUTH_REFRESH_COOKIE_NAME || 'sopy-refresh-token';
      res.cookie(refreshCookieNameEnv, newRefreshToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: refreshMaxAge, path: '/' });

      // Rotate CSRF token as well
      const csrfCookieName = process.env.AUTH_CSRF_COOKIE_NAME || 'sopy-csrf';
      const csrfToken = randomBytes(48).toString('hex');
      res.cookie(csrfCookieName, csrfToken, { httpOnly: false, secure, sameSite: 'lax', maxAge: refreshMaxAge, path: '/' });

      return { success: true, user };
    } catch (err) {
      return { success: false, message: 'Invalid refresh token' };
    }
  }
}
