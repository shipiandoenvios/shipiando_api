import { ProductService } from './product.service';
import { ProductCategoryService } from '../product-category/product-category.service';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductCategoryDto } from '../product-category/dto/update-product-category.dto';

const mockPrisma = {
  product: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  productCategory: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('ProductService RBAC', () => {
  let svc: ProductService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new ProductService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on create when user lacks role', async () => {
    await expect(
      svc.create({} as unknown as CreateProductDto, {
        id: 'u',
        roles: ['USER'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows create for STORE', async () => {
    mockPrisma.product.create.mockResolvedValue({ id: 'p1' });
    const res = await svc.create({} as unknown as CreateProductDto, {
      id: 'u',
      roles: ['STORE'],
    });
    expect(res).toEqual({ id: 'p1' });
  });

  it('filters findAll by clientId', async () => {
    mockPrisma.$transaction.mockResolvedValue([
      1,
      [{ id: 'p1', clientId: 'c1' }],
    ]);
    const res = await svc.findAll({}, 'c1');
    expect(res.items).toHaveLength(1);
  });

  it('forbids findOne when clientId mismatch', async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: 'p2',
      clientId: 'c2',
    });
    await expect(svc.findOne('p2', 'c1')).rejects.toThrow(ForbiddenException);
  });
});

describe('ProductCategoryService RBAC', () => {
  let svc: ProductCategoryService;
  beforeEach(() => {
    jest.resetAllMocks();
    svc = new ProductCategoryService(mockPrisma as unknown as PrismaService);
  });

  it('throws ForbiddenException on update when user lacks role', async () => {
    mockPrisma.productCategory.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'pc1' });
    await expect(
      svc.update('pc1', { name: 'x' } as Partial<UpdateProductCategoryDto>, {
        id: 'u',
        roles: ['CLIENT'],
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows update for ADMIN', async () => {
    mockPrisma.productCategory.findUnique = jest
      .fn()
      .mockResolvedValue({ id: 'pc1' });
    mockPrisma.productCategory.update = jest
      .fn()
      .mockResolvedValue({ id: 'pc1' });
    const res = await svc.update(
      'pc1',
      { name: 'x' } as Partial<UpdateProductCategoryDto>,
      {
        id: 'u',
        roles: ['ADMIN'],
      },
    );
    expect(res).toEqual({ id: 'pc1' });
  });
});
