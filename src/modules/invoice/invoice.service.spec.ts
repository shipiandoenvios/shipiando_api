import { NotificationService } from '../notification/notification.service';
import { InvoiceService } from './invoice.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';

const mockPrisma = {
  invoice: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
  },
};
const mockNotificationService = { sendNotification: jest.fn() };

describe('InvoiceService RBAC and multi-tenant', () => {
  let svc: InvoiceService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new InvoiceService(
      mockPrisma as unknown as PrismaService,
      mockNotificationService as unknown as NotificationService,
    );
  });

  it('throws ForbiddenException on remove when user lacks role', async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue({
      id: 'i1',
      order: { clientId: 'c1' },
    });
    await expect(
      svc.remove('i1', { id: 'u', roles: ['STORE'] }, undefined),
    ).rejects.toThrow(ForbiddenException);
  });

  it('filters findAll by clientId', async () => {
    mockPrisma.invoice.count.mockResolvedValue(1);
    mockPrisma.invoice.findMany.mockResolvedValue([
      { id: 'i1', order: { clientId: 'c1' } },
    ]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.invoice.count).toHaveBeenCalledWith({
      where: { order: { clientId: 'c1' } },
    });
  });

  it('forbids findOne when clientId mismatch', async () => {
    mockPrisma.invoice.findUnique.mockResolvedValue({
      id: 'i2',
      order: { clientId: 'c2' },
    });
    await expect(svc.findOne('i2', 'c1')).rejects.toThrow(ForbiddenException);
  });

  it('allows create when order belongs to client', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1', clientId: 'c1' });
    mockPrisma.invoice.create.mockResolvedValue({ id: 'i2' });
    const res = await svc.create(
      { orderId: 'o1', amount: 10 } as unknown as CreateInvoiceDto,
      { id: 'u', roles: ['CLIENT'] },
      'c1',
    );
    expect(res).toEqual({ id: 'i2' });
  });
});
