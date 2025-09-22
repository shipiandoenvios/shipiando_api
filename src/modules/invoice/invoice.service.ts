import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Invoice } from '@prisma/client';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateInvoiceDto) {
    return this.prisma.invoice.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<Invoice>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.invoice.count(),
      this.prisma.invoice.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async update(id: string, data: UpdateInvoiceDto) {
    await this.findOne(id);
    return this.prisma.invoice.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
