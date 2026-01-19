import {
  allowedRolesForTransition,
  assertCanTransition,
} from './status-transition-permissions.util';
import { PackageStatus } from './dto/create-package.dto';
import { ForbiddenException } from '@nestjs/common';

describe('status transition permissions util', () => {
  it('returns allowed roles for known transition', () => {
    const roles = allowedRolesForTransition(
      'IN_TRANSIT' as PackageStatus,
      'DELIVERED' as PackageStatus,
    );
    expect(roles).toContain('CARRIER');
    expect(roles).toContain('ADMIN');
  });

  it('throws when user lacks role', () => {
    expect(() =>
      assertCanTransition(
        { id: 'u', roles: ['WAREHOUSE'] },
        'IN_TRANSIT' as PackageStatus,
        'DELIVERED' as PackageStatus,
      ),
    ).toThrow(ForbiddenException);
  });

  it('does not throw when user has required role', () => {
    expect(() =>
      assertCanTransition(
        { id: 'u', roles: ['CARRIER'] },
        'IN_TRANSIT' as PackageStatus,
        'DELIVERED' as PackageStatus,
      ),
    ).not.toThrow();
  });
});
