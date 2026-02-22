import { TrackingEventService } from './tracking-event.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrisma = {
  trackingEvent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('TrackingEventService multi-tenant', () => {
  let svc: TrackingEventService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new TrackingEventService(mockPrisma as unknown as PrismaService);
  });

  it('filters findAll by clientId (via shipment.packages.order)', async () => {
    mockPrisma.trackingEvent.count.mockResolvedValue(1);
    mockPrisma.trackingEvent.findMany.mockResolvedValue([{ id: 'e1' }]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.trackingEvent.count).toHaveBeenCalledWith({
      where: {
        shipment: { packages: { some: { order: { clientId: 'c1' } } } },
      },
    });
  });

  it('forbids findOne when shipment packages do not belong to client', async () => {
    mockPrisma.trackingEvent.findUnique.mockResolvedValue({
      id: 'e2',
      shipment: { packages: [{ id: 'p1', order: { clientId: 'c2' } }] },
    });
    await expect(svc.findOne('e2', 'c1')).rejects.toThrow(ForbiddenException);
  });
});
