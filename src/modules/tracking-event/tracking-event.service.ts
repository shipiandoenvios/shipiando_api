import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
} from '../../common/permissions/permission.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrackingEventDto } from './dto/create-tracking-event.dto';
import { UpdateTrackingEventDto } from './dto/update-tracking-event.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { logTrackingEvent } from '../../common/logging/audit.logger';
import type { TrackingEvent } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class TrackingEventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTrackingEventDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER']);
    // Si el frontend envía string, casteamos a enum de Prisma
    const dataToSave: Prisma.TrackingEventUncheckedCreateInput = {
      code: data.code,
      shipmentId: data.shipmentId ?? undefined,
      type: data.type as unknown as Prisma.TrackingEventUncheckedCreateInput['type'],
      description: data.description ?? undefined,
      location: data.location ?? undefined,
      eventAt: data.eventAt ? new Date(data.eventAt) : undefined,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
    };
    const created = await this.prisma.trackingEvent.create({
      data: dataToSave,
    });
    // Structured audit log para tracking events
    try {
      logTrackingEvent({
        timestamp: new Date().toISOString(),
        userId: user?.id ?? null,
        trackingEventId: created.id,
        shipmentId: created.shipmentId,
        code: created.code,
        type: created.type,
        description: created.description ?? undefined,
        eventAt: created.eventAt
          ? new Date(created.eventAt).toISOString()
          : undefined,
        clientId: null,
      });
    } catch (e) {
      console.warn('Failed to write tracking event audit log', e);
    }
    return created;
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<TrackingEvent>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (clientId)
      where.shipment = { packages: { some: { order: { clientId } } } };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.trackingEvent.count({ where }),
      this.prisma.trackingEvent.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const event = await this.prisma.trackingEvent.findUnique({
      where: { id },
      include: {
        shipment: { include: { packages: { include: { order: true } } } },
      },
    });
    if (!event) throw new NotFoundException('TrackingEvent not found');
    if (clientId) {
      const matches = (event.shipment?.packages || []).some(
        (p) => p.order?.clientId === clientId,
      );
      if (!matches)
        throw new ForbiddenException('No autorizado para ver este recurso');
    }
    return event;
  }

  async update(id: string, data: UpdateTrackingEventDto, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER']);
    await this.findOne(id);
    const dataToSave: Prisma.TrackingEventUpdateInput = {
      ...(data.type !== undefined && {
        type: data.type as unknown as Prisma.TrackingEventUpdateInput['type'],
      }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.eventAt !== undefined && {
        eventAt: data.eventAt ? new Date(data.eventAt) : undefined,
      }),
      ...(data.latitude !== undefined && { latitude: data.latitude }),
      ...(data.longitude !== undefined && { longitude: data.longitude }),
    };
    return this.prisma.trackingEvent.update({
      where: { id },
      data: dataToSave,
    });
  }

  async remove(id: string, user?: AppUser) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER']);
    await this.findOne(id);
    return this.prisma.trackingEvent.delete({ where: { id } });
  }
}
