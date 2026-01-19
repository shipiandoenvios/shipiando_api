/// <reference types="jest" />
import { VehicleService } from './vehicle.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

const mockPrisma = {
  vehicle: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('VehicleService RBAC', () => {
  let svc: VehicleService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new VehicleService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on create when user lacks role', async () => {
    await expect(
      svc.create({} as Partial<CreateVehicleDto>, { id: 'u', roles: ['USER'] }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows create for CARRIER', async () => {
    mockPrisma.vehicle.create.mockResolvedValue({ id: 'v1' });
    const res = await svc.create({} as Partial<CreateVehicleDto>, {
      id: 'u',
      roles: ['CARRIER'],
    });
    expect(res).toEqual({ id: 'v1' });
  });
});
