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
import { assertHasPermission } from '../../common/permissions/abac.util';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { Prisma } from '@prisma/client';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import {
  TrackingEventType,
  PackageStatus,
  ShipmentStatus,
} from '@prisma/client';
import type { Shipment } from '@prisma/client';
import { logPolicyDenial } from 'src/common/logging/audit.logger';

@Injectable()
export class ShipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}
  create(data: CreateShipmentDto, user?: AppUser) {
    if (user)
      assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER', 'STORE']);
    return this.prisma.shipment.create({ data });
  }
  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Shipment>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const where: Prisma.ShipmentWhereInput = {};
    if (clientId) where.packages = { some: { order: { clientId } } };
    const [total, items] = await this.prisma.$transaction([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id },
      include: { packages: { include: { order: true } } },
    });
    if (!shipment) throw new NotFoundException('Shipment not found');
    if (clientId) {
      const matches = (shipment.packages || []).some(
        (p) => p.order?.clientId === clientId,
      );
      if (!matches)
        throw new ForbiddenException('No autorizado para ver este recurso');
    }
    return shipment;
  }

  private mapShipmentToPackageStatus(shipmentStatus: ShipmentStatus) {
    switch (shipmentStatus) {
      case 'IN_TRANSIT':
        return PackageStatus.IN_TRANSIT;
      case 'DELIVERED':
        return PackageStatus.DELIVERED;
      case 'RETURNED':
        return PackageStatus.RETURNED;
      default:
        return null;
    }
  }

  private async propagatePackageStatuses(
    shipmentId: string,
    newShipmentStatus: ShipmentStatus,
  ) {
    const pkgStatus = this.mapShipmentToPackageStatus(newShipmentStatus);
    if (!pkgStatus) return;

    await this.prisma.package.updateMany({
      where: {
        shipmentId,
        status: {
          in: [
            'CREATED',
            'AWAITING_CHECKIN',
            'AT_ORIGIN',
            'IN_WAREHOUSE',
            'IN_TRANSIT',
            'OUT_FOR_DELIVERY',
          ],
        },
      },
      data: {
        status: pkgStatus,
        lastStatusAt: new Date(),
      },
    });

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });
    if (shipment) {
      let eventType: TrackingEventType | null = null;
      switch (newShipmentStatus) {
        case 'IN_TRANSIT':
          eventType = TrackingEventType.IN_TRANSIT;
          break;
        case 'DELIVERED':
          eventType = TrackingEventType.DELIVERED;
          break;
        case 'RETURNED':
          eventType = TrackingEventType.RETURNED;
          break;
        default:
          eventType = null;
      }
      if (eventType) {
        try {
          await this.prisma.trackingEvent.create({
            data: {
              shipmentId,
              code: `SHIPMENT_${newShipmentStatus}`,
              type: eventType,
              description: `Actualización de estado de shipment: ${newShipmentStatus}`,
            },
          });
        } catch {
          // non-fatal: tracking event creation
        }
      }
    }
  }

  async update(
    id: string,
    data: UpdateShipmentDto,
    user?: AppUser,
    clientId?: string,
  ) {
    if (user)
      assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER', 'STORE']);
    await this.findOne(id, clientId);

    // tenant scoping
    if (user) assertClientMatches(user, clientId);

    // ABAC check
    try {
      if (user)
        assertHasPermission(user, 'shipment.update', 'shipment', {
          id,
          clientId,
        });
    } catch (e) {
      try {
        logPolicyDenial({
          timestamp: new Date().toISOString(),
          userId: user?.id ?? null,
          action: 'shipment.update',
          resource: 'shipment',
          attrs: { id, clientId },
          reason: String(e),
          clientId,
        });
      } catch {
        // non-fatal: audit logging
      }
      try {
        const admins = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const a of admins) {
          await this.notificationService.sendNotification({
            to: a,
            subject: `Policy denial: shipment.update by ${user?.id ?? 'unknown'}`,
            message: `User ${user?.id ?? 'unknown'} was denied shipment.update on shipment ${id}. Reason: ${String(e)}. attrs=${JSON.stringify({ id, clientId })}`,
            channel: 'email',
            meta: {
              action: 'shipment.update',
              shipmentId: id,
              userId: user?.id ?? null,
            },
          });
        }
      } catch {
        // non-fatal: notification
      }
      throw e;
    }

    const updated = await this.prisma.shipment.update({
      where: { id },
      data,
    });
    if (data.status) {
      await this.propagatePackageStatuses(id, data.status);
    }
    return updated;
  }

  async remove(id: string, user?: AppUser, clientId?: string) {
    if (user) assertHasAnyRole(user, ['ADMIN']);
    await this.findOne(id, clientId);
    return this.prisma.shipment.delete({ where: { id } });
  }

  async bulkUpdatePackages(
    shipmentId: string,
    data: {
      status?:
        | PackageStatus
        | ShipmentStatus
        | 'IN_WAREHOUSE'
        | 'OUT_FOR_DELIVERY';
      currentWarehouseId?: string;
      latitude?: number;
      longitude?: number;
    },
    user?: AppUser,
    clientId?: string,
  ) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER']);

    const shipment = await this.findOne(shipmentId, clientId);
    const packages = await this.prisma.package.findMany({
      where: { shipmentId: shipment.id },
    });
    if (!packages.length) return { updated: 0, packages: [] };

    const now = new Date();
    const updated = await this.prisma.$transaction(
      packages.map((p) =>
        this.prisma.package.update({
          where: { id: p.id },
          data: {
            status: data.status ? (data.status as PackageStatus) : p.status,
            currentWarehouseId: data.currentWarehouseId ?? p.currentWarehouseId,
            latitude: data.latitude ?? p.latitude,
            longitude: data.longitude ?? p.longitude,
            lastStatusAt: data.status ? now : p.lastStatusAt,
            lastScanAt: now,
          },
        }),
      ),
    );

    if (data.status) {
      let eventType: TrackingEventType | null = null;
      switch (data.status) {
        case 'IN_TRANSIT':
          eventType = TrackingEventType.IN_TRANSIT;
          break;
        case 'DELIVERED':
          eventType = TrackingEventType.DELIVERED;
          break;
        case 'RETURNED':
          eventType = TrackingEventType.RETURNED;
          break;
        case 'IN_WAREHOUSE':
          eventType = TrackingEventType.HUB_TRANSFER;
          break;
        case 'OUT_FOR_DELIVERY':
          eventType = TrackingEventType.OUT_FOR_DELIVERY;
          break;
        default:
          eventType = null;
      }
      if (eventType) {
        try {
          await this.prisma.trackingEvent.create({
            data: {
              shipmentId,
              code: `BULK_${data.status}`,
              type: eventType,
              description: `Actualización masiva de paquetes a estado: ${data.status}`,
            },
          });
        } catch {
          /* empty */
        }
      }
    }

    return {
      shipmentId: shipment.id,
      updated: updated.length,
      packages: updated.map((p) => ({
        id: p.id,
        trackingCode: p.trackingCode,
        status: p.status,
        currentWarehouseId: p.currentWarehouseId,
      })),
    };
  }
}
