import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateRoleDto) {
    return this.prisma.role.create({ data });
  }

  async findAll(params?: PaginationQueryDto): Promise<PaginatedResult<Role>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.role.count(),
      this.prisma.role.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: string, data: UpdateRoleDto) {
    await this.findOne(id);
    return this.prisma.role.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({ where: { id } });
  }
}
