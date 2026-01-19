import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
} from '../../common/permissions/permission.util';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Warehouse } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateWarehouseDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'STORE']);
    return this.prisma.warehouse.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Warehouse>> {
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
      this.prisma.warehouse.count({ where }),
      this.prisma.warehouse.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    if (clientId && warehouse.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return warehouse;
  }

  async update(id: string, data: UpdateWarehouseDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE']);
    await this.findOne(id);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN']);
    await this.findOne(id);
    return this.prisma.warehouse.delete({ where: { id } });
  }
}
