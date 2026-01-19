import { ClientUserService } from './client-user.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateClientUserDto } from './dto/update-client-user.dto';

const mockPrisma = {
  clientUser: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ClientUserService RBAC', () => {
  let svc: ClientUserService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new ClientUserService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on update when user lacks role', async () => {
    mockPrisma.clientUser.findUnique.mockResolvedValue({ id: 'cu1' });
    await expect(
      svc.update('cu1', { role: 'ADMIN' } as Partial<UpdateClientUserDto>, {
        id: 'u',
        roles: ['STORE'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows update for ADMIN', async () => {
    mockPrisma.clientUser.findUnique.mockResolvedValue({ id: 'cu1' });
    mockPrisma.clientUser.update.mockResolvedValue({ id: 'cu1' });
    const res = await svc.update(
      'cu1',
      { role: 'USER' } as Partial<UpdateClientUserDto>,
      { id: 'u', roles: ['ADMIN'] },
    );
    expect(res).toEqual({ id: 'cu1' });
  });
});
