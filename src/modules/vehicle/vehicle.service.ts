import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  assertHasAnyRole,
  AppUser,
} from '../../common/permissions/permission.util';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Vehicle } from '@prisma/client';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateVehicleDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CARRIER', 'STORE']);
    return this.prisma.vehicle.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<Vehicle>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.vehicle.count(),
      this.prisma.vehicle.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async update(id: string, data: UpdateVehicleDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CARRIER', 'STORE']);
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CARRIER', 'STORE']);
    await this.findOne(id);
    return this.prisma.vehicle.delete({ where: { id } });
  }
}
