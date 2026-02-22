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
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Order } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOrderDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    if (user) assertClientMatches(user, data.clientId);
    if (user?.roles?.includes('CLIENT') && 'clientId' in user) {
      data.clientId = user.clientId as string;
    }
    return this.prisma.order.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Order>> {
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
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (clientId && order.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return order;
  }

  async update(id: string, data: UpdateOrderDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    await this.findOne(id);
    return this.prisma.order.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT']);
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
}
