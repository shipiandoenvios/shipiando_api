import { NotificationService } from '../notification/notification.service';
import { PackageService } from './package.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreatePackageDto } from './dto/create-package.dto';

const mockPrisma = {
  package: {
    findUnique: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
  },
};
const mockNotification = { sendNotification: jest.fn() };

describe('PackageService RBAC and multi-tenant', () => {
  let svc: PackageService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new PackageService(
      mockPrisma as unknown as PrismaService,
      mockNotification as unknown as NotificationService,
    );
  });

  it('throws ForbiddenException on update when user lacks role', async () => {
    mockPrisma.package.findUnique.mockResolvedValue({ id: 'pkg1' });
    await expect(
      svc.update('pkg1', { heightCm: 10 } as Partial<UpdatePackageDto>, {
        id: 'u',
        roles: ['CLIENT'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates when user has allowed role', async () => {
    mockPrisma.package.findUnique.mockResolvedValue({ id: 'pkg1' });
    mockPrisma.package.update.mockResolvedValue({ id: 'pkg1', heightCm: 10 });
    const res = await svc.update(
      'pkg1',
      { heightCm: 10 } as Partial<UpdatePackageDto>,
      {
        id: 'u',
        roles: ['WAREHOUSE'],
      },
    );
    expect(res).toEqual({ id: 'pkg1', heightCm: 10 });
  });

  it('throws ForbiddenException when attempting a status transition without required role', async () => {
    // existing package is IN_TRANSIT, trying to set DELIVERED requires CARRIER or ADMIN
    mockPrisma.package.findUnique.mockResolvedValue({
      id: 'pkg2',
      status: 'IN_TRANSIT',
    });
    await expect(
      svc.update('pkg2', { status: 'DELIVERED' } as Partial<UpdatePackageDto>, {
        id: 'u',
        roles: ['WAREHOUSE'],
      }),
    ).rejects.toThrow();
  });

  it('allows status transition when user has required role', async () => {
    mockPrisma.package.findUnique.mockResolvedValue({
      id: 'pkg3',
      status: 'IN_TRANSIT',
    });
    mockPrisma.package.update.mockResolvedValue({
      id: 'pkg3',
      status: 'DELIVERED',
    });
    const res = await svc.update(
      'pkg3',
      { status: 'DELIVERED' } as Partial<UpdatePackageDto>,
      { id: 'u', roles: ['CARRIER'] },
    );
    expect(res).toEqual({ id: 'pkg3', status: 'DELIVERED' });
  });

  it('filters findAll by clientId (via order)', async () => {
    mockPrisma.package.count.mockResolvedValue(1);
    mockPrisma.package.findMany.mockResolvedValue([
      { id: 'p1', orderId: 'o1' },
    ]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.package.count).toHaveBeenCalledWith({
      where: { order: { clientId: 'c1' } },
    });
  });

  it('forbids findOne when clientId mismatch', async () => {
    mockPrisma.package.findUnique.mockResolvedValue({
      id: 'p2',
      order: { clientId: 'c2' },
    });
    await expect(svc.findOne('p2', 'c1')).rejects.toThrow(ForbiddenException);
  });

  it('forbids scanAndUpdate when clientId mismatch', async () => {
    mockPrisma.package.findUnique.mockResolvedValue({
      id: 'p3',
      order: { clientId: 'c2' },
      status: 'IN_WAREHOUSE',
    });
    await expect(
      svc.scanAndUpdate(
        'p3',
        { status: 'IN_TRANSIT' } as Partial<UpdatePackageDto>,
        undefined,
        undefined,
        'c1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows create when order belongs to client for CLIENT role', async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: 'o1', clientId: 'c1' });
    mockPrisma.package.create.mockResolvedValue({ id: 'p4' });
    const res = await svc.create(
      { orderId: 'o1' } as Partial<CreatePackageDto>,
      { id: 'u', roles: ['CLIENT'] },
      'c1',
    );
    expect(res).toEqual({ id: 'p4' });
  });
});
