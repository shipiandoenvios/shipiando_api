import { NotificationService } from '../notification/notification.service';
import { ShipmentService } from './shipment.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkUpdateShipmentPackagesDto } from './dto/bulk-update-shipment-packages.dto';

const mockPrisma = {
  shipment: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  package: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};
const mockNotificationService = { sendNotification: jest.fn() };

describe('ShipmentService RBAC and multi-tenant', () => {
  let svc: ShipmentService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new ShipmentService(
      mockPrisma as unknown as PrismaService,
      mockNotificationService as unknown as NotificationService,
    );
  });

  it('throws ForbiddenException on remove when user lacks ADMIN', async () => {
    mockPrisma.shipment.findUnique.mockResolvedValue({ id: 's1' });
    await expect(
      svc.remove('s1', { id: 'u', roles: ['WAREHOUSE'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows remove for ADMIN', async () => {
    mockPrisma.shipment.findUnique.mockResolvedValue({ id: 's1' });
    mockPrisma.shipment.delete.mockResolvedValue({ id: 's1' });
    const res = await svc.remove('s1', { id: 'u', roles: ['ADMIN'] });
    expect(res).toEqual({ id: 's1' });
  });

  it('throws ForbiddenException on bulkUpdatePackages for CLIENT role', async () => {
    mockPrisma.shipment.findUnique.mockResolvedValue({ id: 's1' });
    mockPrisma.package.findMany.mockResolvedValue([]);
    await expect(
      svc.bulkUpdatePackages(
        's1',
        { status: 'IN_TRANSIT' } as Partial<BulkUpdateShipmentPackagesDto>,
        {
          id: 'u',
          roles: ['CLIENT'],
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('filters findAll by clientId', async () => {
    mockPrisma.shipment.count.mockResolvedValue(1);
    mockPrisma.shipment.findMany.mockResolvedValue([{ id: 's1' }]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.shipment.count).toHaveBeenCalledWith({
      where: { packages: { some: { order: { clientId: 'c1' } } } },
    });
  });

  it('forbids findOne when no packages belong to client', async () => {
    mockPrisma.shipment.findUnique.mockResolvedValue({
      id: 's2',
      packages: [{ id: 'p1', order: { clientId: 'c2' } }],
    });
    await expect(svc.findOne('s2', 'c1')).rejects.toThrow(ForbiddenException);
  });

  it('allows findOne when at least one package belongs to client', async () => {
    mockPrisma.shipment.findUnique.mockResolvedValue({
      id: 's3',
      packages: [
        { id: 'p1', order: { clientId: 'c2' } },
        { id: 'p2', order: { clientId: 'c1' } },
      ],
    });
    const res = await svc.findOne('s3', 'c1');
    expect(res).toHaveProperty('id', 's3');
  });
});
