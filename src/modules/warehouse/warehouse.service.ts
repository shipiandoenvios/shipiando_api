import { Injectable, NotFoundException } from '@nestjs/common';
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

  create(data: CreateWarehouseDto) {
    return this.prisma.warehouse.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<Warehouse>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.warehouse.count(),
      this.prisma.warehouse.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundException('Warehouse not found');
    return warehouse;
  }

  async update(id: string, data: UpdateWarehouseDto) {
    await this.findOne(id);
    return this.prisma.warehouse.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.warehouse.delete({ where: { id } });
  }
}
