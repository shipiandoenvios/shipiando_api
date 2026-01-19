import { BadRequestException } from '@nestjs/common';

export function validatePasswordPolicy(password: string) {
  const minLen = Number(process.env.PASSWORD_MIN_LENGTH) || 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (typeof password !== 'string' || password.length < minLen) {
    throw new BadRequestException(
      `Password must be at least ${minLen} characters`,
    );
  }
  if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
    throw new BadRequestException(
      'Password must include upper, lower, number and symbol',
    );
  }
  return true;
}
