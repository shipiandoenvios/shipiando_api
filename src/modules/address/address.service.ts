import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Address } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateAddressDto) {
    return this.prisma.address.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<Address>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.address.count(),
      this.prisma.address.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Address not found');
    return address;
  }

  async update(id: string, data: UpdateAddressDto) {
    await this.findOne(id);
    return this.prisma.address.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.address.delete({ where: { id } });
  }
}
