import { ClientService } from './client.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  client: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaService;

describe('ClientService RBAC and multi-tenant', () => {
  let svc: ClientService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new ClientService(mockPrisma);
  });

  it('throws ForbiddenException on remove when user lacks ADMIN', async () => {
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1' });
    await expect(
      svc.remove('c1', { id: 'u', roles: ['CLIENT'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows remove for ADMIN', async () => {
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c1' });
    mockPrisma.client.delete.mockResolvedValue({ id: 'c1' });
    const res = await svc.remove('c1', { id: 'u', roles: ['ADMIN'] });
    expect(res).toEqual({ id: 'c1' });
  });

  it('filters findAll by clientId', async () => {
    mockPrisma.client.count.mockResolvedValue(1);
    mockPrisma.client.findMany.mockResolvedValue([{ id: 'c1' }]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.client.count).toHaveBeenCalledWith({
      where: { id: 'c1' },
    });
  });

  it('forbids findOne when clientId mismatch', async () => {
    mockPrisma.client.findUnique.mockResolvedValue({ id: 'c2' });
    await expect(svc.findOne('c2', 'c1')).rejects.toThrow(ForbiddenException);
  });
});
