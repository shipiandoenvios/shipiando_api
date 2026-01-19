import { CarrierService } from './carrier.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  carrier: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaService;

describe('CarrierService RBAC', () => {
  let svc: CarrierService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new CarrierService(mockPrisma);
  });

  it('throws ForbiddenException on remove when user lacks role', async () => {
    mockPrisma.carrier.findUnique.mockResolvedValue({ id: 'c1' });
    await expect(
      svc.remove('c1', { id: 'u', roles: ['WAREHOUSE'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows remove for ADMIN', async () => {
    mockPrisma.carrier.findUnique.mockResolvedValue({ id: 'c1' });
    mockPrisma.carrier.delete.mockResolvedValue({ id: 'c1' });
    const res = await svc.remove('c1', { id: 'u', roles: ['ADMIN'] });
    expect(res).toEqual({ id: 'c1' });
  });
});
