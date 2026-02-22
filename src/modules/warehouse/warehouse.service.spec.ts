/// <reference types="jest" />
import { WarehouseService } from './warehouse.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  warehouse: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaService;

describe('WarehouseService RBAC', () => {
  let svc: WarehouseService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new WarehouseService(mockPrisma);
  });

  it('throws ForbiddenException on remove when user lacks ADMIN', async () => {
    (mockPrisma.warehouse.findUnique as jest.Mock).mockResolvedValue({
      id: 'w1',
    });
    await expect(
      svc.remove('w1', { id: 'u', roles: ['WAREHOUSE'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows remove for ADMIN', async () => {
    (mockPrisma.warehouse.findUnique as jest.Mock).mockResolvedValue({
      id: 'w1',
    });
    (mockPrisma.warehouse.delete as jest.Mock).mockResolvedValue({ id: 'w1' });
    const res = await svc.remove('w1', { id: 'u', roles: ['ADMIN'] });
    expect(res).toEqual({ id: 'w1' });
  });

  it('filters findAll by clientId', async () => {
    (mockPrisma.warehouse.count as jest.Mock).mockResolvedValue(1);
    (mockPrisma.warehouse.findMany as jest.Mock).mockResolvedValue([
      { id: 'w1', clientId: 'c1' },
    ]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.warehouse.count).toHaveBeenCalledWith({
      where: { clientId: 'c1' },
    });
  });

  it('forbids findOne when clientId mismatch', async () => {
    (mockPrisma.warehouse.findUnique as jest.Mock).mockResolvedValue({
      id: 'w2',
      clientId: 'c2',
    });
    await expect(svc.findOne('w2', 'c1')).rejects.toThrow(ForbiddenException);
  });
});
