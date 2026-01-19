import { OrderService } from './order.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

const mockPrisma = {
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('OrderService RBAC', () => {
  let svc: OrderService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new OrderService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on remove when user lacks role', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1' });
    await expect(
      svc.remove('o1', { id: 'u', roles: ['STORE'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows remove for CLIENT', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1' });
    mockPrisma.order.delete.mockResolvedValue({ id: 'o1' });
    const res = await svc.remove('o1', { id: 'u', roles: ['CLIENT'] });
    expect(res).toEqual({ id: 'o1' });
  });

  it('throws ForbiddenException on create when user lacks role', async () => {
    await expect(
      svc.create({} as unknown as CreateOrderDto, {
        id: 'u',
        roles: ['WAREHOUSE'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('filters findAll by clientId when provided', async () => {
    mockPrisma.order.count.mockResolvedValue(1);
    mockPrisma.order.findMany.mockResolvedValue([{ id: 'o1', clientId: 'c1' }]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.order.count).toHaveBeenCalledWith({
      where: { clientId: 'c1' },
    });
  });

  it('forbids findOne when clientId does not match', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o2', clientId: 'c2' });
    await expect(svc.findOne('o2', 'c1')).rejects.toThrow(ForbiddenException);
  });
});
