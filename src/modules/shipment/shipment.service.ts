import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { Prisma, TrackingEventType } from '@prisma/client';

@Injectable()
export class ShipmentService {
  constructor(private readonly prisma: PrismaService) {}
  create(data: CreateShipmentDto) {
    return this.prisma.shipment.create({ data });
  }
  async findAll(params?: PaginationQueryDto): Promise<PaginatedResult<any>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, data] = await this.prisma.$transaction([
      this.prisma.shipment.count(),
      this.prisma.shipment.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const shipment = await this.prisma.shipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException('Shipment not found');
    return shipment;
  }

  private mapShipmentToPackageStatus(shipmentStatus: string) {
    switch (shipmentStatus) {
      case 'IN_TRANSIT':
        return 'IN_TRANSIT';
      case 'DELIVERED':
        return 'DELIVERED';
      case 'RETURNED':
        return 'RETURNED';
      default:
        return null;
    }
  }

  private async propagatePackageStatuses(
    shipmentId: string,
    newShipmentStatus: string,
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
        status: pkgStatus as any,
        lastStatusAt: new Date(),
      },
    });

    const shipment = await this.prisma.shipment.findUnique({ where: { id: shipmentId } });
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
        } catch (e) {}
      }
    }
  }

  async update(id: string, data: UpdateShipmentDto) {
    await this.findOne(id);
    const updated = await this.prisma.shipment.update({
      where: { id },
      data,
    });
    if (data.status) {
      await this.propagatePackageStatuses(id, data.status);
    }
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.shipment.delete({ where: { id } });
  }

  async bulkUpdatePackages(
    shipmentId: string,
    data: {
      status?: string;
      currentWarehouseId?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const shipment = await this.findOne(shipmentId);
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
            status: data.status ? (data.status as any) : p.status,
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
        } catch (e) { }
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
