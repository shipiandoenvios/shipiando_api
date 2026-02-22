import { Injectable, NotFoundException } from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
} from '../../common/permissions/permission.util';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { logRoleChange } from '../../common/logging/audit.logger';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRoleDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN']);
    const created = await this.prisma.role.create({ data });
    try {
      logRoleChange({
        timestamp: new Date().toISOString(),
        userId: user?.id ?? null,
        roleId: created.id,
        action: 'create',
        after: created,
      });
    } catch (e) {
      console.warn('Failed to write role audit log', e);
    }
    return created;
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

  async update(id: string, data: UpdateRoleDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN']);
    const before = await this.findOne(id);
    const updated = await this.prisma.role.update({ where: { id }, data });
    try {
      logRoleChange({
        timestamp: new Date().toISOString(),
        userId: user?.id ?? null,
        roleId: id,
        action: 'update',
        before,
        after: updated,
      });
    } catch (e) {
      console.warn('Failed to write role audit log', e);
    }
    return updated;
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN']);
    const before = await this.findOne(id);
    const deleted = await this.prisma.role.delete({ where: { id } });
    try {
      logRoleChange({
        timestamp: new Date().toISOString(),
        userId: user?.id ?? null,
        roleId: id,
        action: 'delete',
        before,
      });
    } catch (e) {
      console.warn('Failed to write role audit log', e);
    }
    return deleted;
  }
}
