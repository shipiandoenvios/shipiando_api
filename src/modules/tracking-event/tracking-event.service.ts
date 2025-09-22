import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { UpdateTrackingEventDto } from './dto/update-tracking-event.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { TrackingEvent } from '@prisma/client';

@Injectable()
export class TrackingEventService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateTrackingEventDto) {
    return this.prisma.trackingEvent.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<TrackingEvent>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.trackingEvent.count(),
      this.prisma.trackingEvent.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const event = await this.prisma.trackingEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('TrackingEvent not found');
    return event;
  }

  async update(id: string, data: UpdateTrackingEventDto) {
    await this.findOne(id);
    return this.prisma.trackingEvent.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.trackingEvent.delete({ where: { id } });
  }
}
