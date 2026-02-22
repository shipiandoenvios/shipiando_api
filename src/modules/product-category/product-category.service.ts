import { Injectable, NotFoundException } from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
} from '../../common/permissions/permission.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { ProductCategory } from '@prisma/client';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProductCategoryDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'STORE']);
    return this.prisma.productCategory.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<ProductCategory>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.productCategory.count(),
      this.prisma.productCategory.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const category = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('ProductCategory not found');
    return category;
  }

  async update(id: string, data: UpdateProductCategoryDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'STORE']);
    await this.findOne(id);
    return this.prisma.productCategory.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'STORE']);
    await this.findOne(id);
    return this.prisma.productCategory.delete({ where: { id } });
  }
}
