import { assertHasAnyRole } from './permission.util';
import { ForbiddenException } from '@nestjs/common';

describe('assertHasAnyRole', () => {
  it('throws if user is missing', () => {
    expect(() => assertHasAnyRole(undefined, ['ADMIN'])).toThrow(
      ForbiddenException,
    );
  });

  it('throws if user has no roles', () => {
    expect(() =>
      assertHasAnyRole({ id: 'u', roles: undefined }, ['ADMIN']),
    ).toThrow(ForbiddenException);
  });

  it('throws if no matching role', () => {
    expect(() =>
      assertHasAnyRole({ id: 'u', roles: ['CLIENT'] }, ['ADMIN']),
    ).toThrow(ForbiddenException);
  });

  it('does not throw if at least one role matches', () => {
    expect(() =>
      assertHasAnyRole({ id: 'u', roles: ['CLIENT', 'ADMIN'] }, ['ADMIN']),
    ).not.toThrow();
  });
});
