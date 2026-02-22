import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
} from '../../common/permissions/permission.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Inventory } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateInventoryDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'STORE']);
    return this.prisma.inventory.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Inventory>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (clientId) where.warehouse = { clientId };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.inventory.count({ where }),
      this.prisma.inventory.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { id },
      include: { warehouse: true },
    });
    if (!inventory) throw new NotFoundException('Inventory not found');
    if (clientId && inventory.warehouse?.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return inventory;
  }

  async update(id: string, data: UpdateInventoryDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'STORE']);
    await this.findOne(id);
    return this.prisma.inventory.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'STORE']);
    await this.findOne(id);
    return this.prisma.inventory.delete({ where: { id } });
  }
}
