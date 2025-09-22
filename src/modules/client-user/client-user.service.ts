import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { ClientUser } from '@prisma/client';

@Injectable()
export class ClientUserService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateClientUserDto) {
    return this.prisma.clientUser.create({ data });
  }

  async findByClient(
    clientId: string,
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<ClientUser>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.clientUser.count({ where: { clientId } }),
      this.prisma.clientUser.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findByUser(
    userId: string,
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<ClientUser>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.clientUser.count({ where: { userId } }),
      this.prisma.clientUser.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async update(id: string, data: UpdateClientUserDto) {
    const existing = await this.prisma.clientUser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ClientUser not found');
    }
    return this.prisma.clientUser.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.clientUser.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('ClientUser not found');
    }
    return this.prisma.clientUser.delete({ where: { id } });
  }
}
