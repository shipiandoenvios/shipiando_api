import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
  assertClientMatches,
} from '../../common/permissions/permission.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginatedResult,
  PaginatedResult,
} from '../../common/utils/pagination.util';
import type { Product } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateProductDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    if (user) assertClientMatches(user, data.clientId);
    if (user?.roles?.includes('CLIENT') && 'clientId' in user) {
      data.clientId = user.clientId as string;
    }
    return this.prisma.product.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Product>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const where: { clientId?: string } = {};
    if (clientId) where.clientId = clientId;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    if (clientId && product.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return product;
  }

  async update(id: string, data: UpdateProductDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
