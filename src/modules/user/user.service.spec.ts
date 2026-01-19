import { UserService } from './user.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('UserService RBAC', () => {
  let svc: UserService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new UserService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on create when non-admin attempts', async () => {
    await expect(
      svc.create({} as unknown as CreateUserDto, { id: 'u', roles: ['USER'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows create for ADMIN', async () => {
    mockPrisma.user.create.mockResolvedValue({ id: 'u1' });
    const res = await svc.create({} as unknown as CreateUserDto, {
      id: 'u',
      roles: ['ADMIN'],
    });
    expect(res).toEqual({ id: 'u1' });
  });
});
