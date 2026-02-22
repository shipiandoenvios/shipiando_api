import { InventoryService } from './inventory.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  inventory: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('InventoryService multi-tenant', () => {
  let svc: InventoryService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new InventoryService(mockPrisma as unknown as PrismaService);
  });

  it('filters findAll by clientId (warehouse)', async () => {
    mockPrisma.inventory.count.mockResolvedValue(1);
    mockPrisma.inventory.findMany.mockResolvedValue([
      { id: 'inv1', warehouse: { clientId: 'c1' } },
    ]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.inventory.count).toHaveBeenCalledWith({
      where: { warehouse: { clientId: 'c1' } },
    });
  });

  it('forbids findOne when warehouse clientId mismatch', async () => {
    mockPrisma.inventory.findUnique.mockResolvedValue({
      id: 'inv2',
      warehouse: { clientId: 'c2' },
    });
    await expect(svc.findOne('inv2', 'c1')).rejects.toThrow(ForbiddenException);
  });
});
