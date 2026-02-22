import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
  assertClientMatches,
} from '../../common/permissions/permission.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Client } from '@prisma/client';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateClientDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    if (user && 'id' in data && typeof data.id === 'string') {
      assertClientMatches(user, data.id);
    }
    return this.prisma.client.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Client>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const where: { id?: string } = {};
    if (clientId) where.id = clientId;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    if (clientId && client.id !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return client;
  }

  async update(id: string, data: UpdateClientDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT']);
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN']);
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }
}
