import { AddressService } from './address.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

const mockPrisma = {
  address: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('AddressService RBAC', () => {
  let svc: AddressService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new AddressService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on create when user lacks role', async () => {
    await expect(
      svc.create({} as unknown as CreateAddressDto, {
        id: 'u',
        roles: ['WAREHOUSE'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows create for CLIENT', async () => {
    mockPrisma.address.create.mockResolvedValue({ id: 'a1' });
    const res = await svc.create({} as unknown as CreateAddressDto, {
      id: 'u',
      roles: ['CLIENT'],
    });
    expect(res).toEqual({ id: 'a1' });
  });

  it('filters findAll by clientId', async () => {
    mockPrisma.address.count.mockResolvedValue(1);
    mockPrisma.address.findMany.mockResolvedValue([
      { id: 'a1', clientId: 'c1' },
    ]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
    expect(mockPrisma.address.count).toHaveBeenCalledWith({
      where: { clientId: 'c1' },
    });
  });

  it('forbids findOne when clientId mismatch', async () => {
    mockPrisma.address.findUnique.mockResolvedValue({
      id: 'a2',
      clientId: 'c2',
    });
    await expect(svc.findOne('a2', 'c1')).rejects.toThrow(ForbiddenException);
  });
});
