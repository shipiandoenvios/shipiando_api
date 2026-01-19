import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import {
  assertHasAnyRole,
  AppUser,
  assertClientMatches,
} from '../../common/permissions/permission.util';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Address } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAddressDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'USER', 'STORE']);
    if (user) assertClientMatches(user, data.clientId);
    if (user?.roles?.includes('CLIENT') && 'clientId' in user) {
      const boundClient = user.clientId;
      if (boundClient) data.clientId = boundClient;
    }
    return this.prisma.address.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Address>> {
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
      this.prisma.address.count({ where }),
      this.prisma.address.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    if (clientId && address.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return address;
  }

  async update(id: string, data: UpdateAddressDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'USER', 'STORE']);
    await this.findOne(id);
    return this.prisma.address.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'USER', 'STORE']);
    await this.findOne(id);
    return this.prisma.address.delete({ where: { id } });
  }
}
