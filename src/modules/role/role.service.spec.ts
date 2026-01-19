/// <reference types="jest" />
import { RoleService } from './role.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

const mockPrisma = {
  role: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('RoleService RBAC', () => {
  let svc: RoleService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new RoleService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on create when user not ADMIN', async () => {
    await expect(
      svc.create({} as unknown as CreateRoleDto, { id: 'u', roles: ['USER'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows create for ADMIN', async () => {
    mockPrisma.role.create.mockResolvedValue({ id: 'r1' });
    const res = await svc.create({} as unknown as CreateRoleDto, {
      id: 'u',
      roles: ['ADMIN'],
    });
    expect(res).toEqual({ id: 'r1' });
  });
});
