import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePackageDto,
  PackageStatus as DtoPackageStatus,
} from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from 'src/common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { randomBytes } from 'crypto';
import {
  TrackingEventType,
  PackageStatus as PrismaPackageStatus,
} from '@prisma/client';

type ShipmentContext = {
  id: string;
  status: Shipment['status'];
  carrier?: Carrier | null;
  origin?: Address | null;
  destination?: Address | null;
  currentWarehouse?: Warehouse | null;
  destinationWarehouse?: Warehouse | null;
  vehicle?: Vehicle | null;
  externalTrackingCode?: string | null;
  shippedAt?: Date | null;
  deliveredAt?: Date | null;
  packages?: Package[] | null;
  events?: TrackingEvent[] | null;
};

type FullContext = {
  package: Package & { origin?: Address | null; destination?: Address | null };
  shipment: ShipmentContext | null;
};
import {
  Package,
  Shipment,
  Carrier,
  Address,
  Warehouse,
  Vehicle,
  TrackingEvent,
} from '@prisma/client';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  private shipmentInclude = {
    carrier: true,
    origin: true,
    destination: true,
    currentWarehouse: true,
    destinationWarehouse: true,
    vehicle: true,
    packages: true,
    events: {
      orderBy: { eventAt: 'asc' as const },
    },
  };

  private async generateUniqueTrackingCode(
    prefix = 'PKG',
    attempts = 5,
  ): Promise<string> {
    for (let i = 0; i < attempts; i++) {
      const candidate = `${prefix}-${randomBytes(5).toString('hex').toUpperCase()}`;
      const exists = await this.prisma.package.findUnique({
        where: { trackingCode: candidate },
      });
      if (!exists) return candidate;
    }
    throw new Error(
      'No se pudo generar trackingCode único tras varios intentos',
    );
  }

  private mapPackageStatusToEventType(
    status: string | undefined,
  ): TrackingEventType | null {
    switch (status) {
      case 'CREATED':
        return TrackingEventType.CREATED;
      case 'AWAITING_CHECKIN':
        return TrackingEventType.LABEL_PRINTED;
      case 'AT_ORIGIN':
        return TrackingEventType.PICKED_UP;
      case 'IN_WAREHOUSE':
        return TrackingEventType.HUB_TRANSFER;
      case 'IN_TRANSIT':
        return TrackingEventType.IN_TRANSIT;
      case 'OUT_FOR_DELIVERY':
        return TrackingEventType.OUT_FOR_DELIVERY;
      case 'DELIVERED':
        return TrackingEventType.DELIVERED;
      case 'RETURNED':
        return TrackingEventType.RETURNED;
      case 'EXCEPTION':
        return TrackingEventType.EXCEPTION;
      default:
        return null;
    }
  }

  private async createTrackingEventForPackage(opts: {
    shipmentId?: string | null;
    status?: string;
    locationHint?: string;
    latitude?: number;
    longitude?: number;
  }) {
    if (!opts.shipmentId) return;
    const eventType = this.mapPackageStatusToEventType(opts.status);
    if (!eventType) return;
    try {
      await this.prisma.trackingEvent.create({
        data: {
          shipmentId: opts.shipmentId,
          code: `PKG_${opts.status}`,
          type: eventType,
          description: `Actualización de estado de paquete: ${opts.status}`,
          location: opts.locationHint,
          latitude: opts.latitude,
          longitude: opts.longitude,
        },
      });
    } catch {
      void 0;
    }
  }

  private filterContext(full: FullContext, viewerType: string) {
    const vt = (viewerType || 'PUBLIC').toUpperCase();
    const basePkg = full.package;
    const baseShipment = full.shipment;

    const publicPackage = {
      id: basePkg.id,
      trackingCode: basePkg.trackingCode,
      status: basePkg.status,
      lastStatusAt: basePkg.lastStatusAt,
      lastScanAt: basePkg.lastScanAt,
      heightCm: basePkg.heightCm,
      lengthCm: basePkg.lengthCm,
      widthCm: basePkg.widthCm,
      weightKg: basePkg.weightKg,
      origin: basePkg.origin
        ? {
            id: basePkg.origin.id,
            city: basePkg.origin.city,
            country: basePkg.origin.country,
          }
        : null,
      destination: basePkg.destination
        ? {
            id: basePkg.destination.id,
            city: basePkg.destination.city,
            country: basePkg.destination.country,
          }
        : null,
    };

    const publicShipment = baseShipment
      ? {
          id: baseShipment.id,
          status: baseShipment.status,
          deliveredAt: baseShipment.deliveredAt,
          shippedAt: baseShipment.shippedAt,
          origin: baseShipment.origin
            ? { id: baseShipment.origin.id, city: baseShipment.origin.city }
            : null,
          destination: baseShipment.destination
            ? {
                id: baseShipment.destination.id,
                city: baseShipment.destination.city,
              }
            : null,
          events: baseShipment.events?.map((e: TrackingEvent) => ({
            code: e.code,
            type: e.type,
            eventAt: e.eventAt,
            location: e.location,
          })),
        }
      : null;
    if (vt === 'PUBLIC')
      return { package: publicPackage, shipment: publicShipment };
    if (vt === 'USER')
      return {
        package: {
          ...publicPackage,
          latitude: basePkg.latitude,
          longitude: basePkg.longitude,
        },
        shipment: publicShipment,
      };
    if (vt === 'CLIENT')
      return {
        package: {
          ...publicPackage,
          orderId: basePkg.orderId,
          currentWarehouseId: basePkg.currentWarehouseId,
        },
        shipment: publicShipment,
      };

    if (vt === 'WAREHOUSE' || vt === 'CARRIER') {
      return {
        package: basePkg,
        shipment: baseShipment
          ? {
              ...baseShipment,
              packages: baseShipment.packages?.map((p: Package) => ({
                id: p.id,
                trackingCode: p.trackingCode,
                status: p.status,
                currentWarehouseId: p.currentWarehouseId,
              })),
            }
          : null,
      };
    }
    return full;
  }

  private buildContext(
    pkg: Package & {
      origin?: Address | null;
      destination?: Address | null;
    },
    shipment:
      | (Shipment & {
          carrier?: Carrier | null;
          origin?: Address | null;
          destination?: Address | null;
          currentWarehouse?: Warehouse | null;
          destinationWarehouse?: Warehouse | null;
          vehicle?: Vehicle | null;
          packages?: Package[];
          events?: TrackingEvent[];
        })
      | null,
    viewerType?: string,
  ) {
    const full = {
      package: pkg,
      shipment: shipment
        ? {
            id: shipment.id,
            status: shipment.status,
            carrier: shipment.carrier,
            origin: shipment.origin,
            destination: shipment.destination,
            currentWarehouse: shipment.currentWarehouse,
            destinationWarehouse: shipment.destinationWarehouse,
            vehicle: shipment.vehicle,
            externalTrackingCode: shipment.externalTrackingCode,
            shippedAt: shipment.shippedAt,
            deliveredAt: shipment.deliveredAt,
            packages: shipment.packages,
            events: shipment.events,
          }
        : null,
    };
    return this.filterContext(full, viewerType || 'PUBLIC');
  }

  async create(data: CreatePackageDto) {
    if (!data.trackingCode) {
      data.trackingCode = await this.generateUniqueTrackingCode();
    } else {
      const exists = await this.prisma.package.findUnique({
        where: { trackingCode: data.trackingCode },
      });
      if (exists) {
        data.trackingCode = await this.generateUniqueTrackingCode();
      }
    }
    if (!data.status) {
      data.status = DtoPackageStatus.CREATED;
    }
    return this.prisma.package.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
  ): Promise<PaginatedResult<Package>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;
    const [total, items] = await this.prisma.$transaction([
      this.prisma.package.count(),
      this.prisma.package.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const pkg = await this.prisma.package.findUnique({ where: { id } });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async findOneWithContext(id: string, viewerType?: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { origin: true, destination: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    let shipment:
      | (Shipment & {
          carrier?: Carrier | null;
          origin?: Address | null;
          destination?: Address | null;
          currentWarehouse?: Warehouse | null;
          destinationWarehouse?: Warehouse | null;
          vehicle?: Vehicle | null;
          packages?: Package[];
          events?: TrackingEvent[];
        })
      | null = null;
    if (pkg.shipmentId) {
      shipment = await this.prisma.shipment.findUnique({
        where: { id: pkg.shipmentId },
        include: this.shipmentInclude,
      });
    }
    return this.buildContext(pkg, shipment, viewerType);
  }

  async findByTrackingCode(trackingCode: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { trackingCode },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    return pkg;
  }

  async findByTrackingCodeWithContext(
    trackingCode: string,
    viewerType?: string,
  ) {
    const pkg = await this.prisma.package.findUnique({
      where: { trackingCode },
      include: { origin: true, destination: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    let shipment:
      | (Shipment & {
          carrier?: Carrier | null;
          origin?: Address | null;
          destination?: Address | null;
          currentWarehouse?: Warehouse | null;
          destinationWarehouse?: Warehouse | null;
          vehicle?: Vehicle | null;
          packages?: Package[];
          events?: TrackingEvent[];
        })
      | null = null;
    if (pkg.shipmentId) {
      shipment = await this.prisma.shipment.findUnique({
        where: { id: pkg.shipmentId },
        include: this.shipmentInclude,
      });
    }
    return this.buildContext(pkg, shipment, viewerType);
  }

  async update(id: string, data: UpdatePackageDto) {
    await this.findOne(id);
    return this.prisma.package.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.package.delete({ where: { id } });
  }

  async scanAndUpdate(
    id: string,
    data: {
      status?: PrismaPackageStatus;
      latitude?: number;
      longitude?: number;
      currentWarehouseId?: string;
    },
  ) {
    const pkg = await this.findOne(id);
    const previousStatus = pkg.status;
    const updated = await this.prisma.package.update({
      where: { id },
      data: {
        ...(data.status !== undefined ? { status: data.status } : {}),
        latitude: data.latitude ?? pkg.latitude,
        longitude: data.longitude ?? pkg.longitude,
        currentWarehouseId: data.currentWarehouseId ?? pkg.currentWarehouseId,
        lastScanAt: new Date(),
        lastStatusAt: data.status ? new Date() : pkg.lastStatusAt,
      },
    });
    if (data.status && data.status !== previousStatus) {
      await this.createTrackingEventForPackage({
        shipmentId: updated.shipmentId,
        status: data.status,
        latitude: updated.latitude ?? undefined,
        longitude: updated.longitude ?? undefined,
      });
    }
    return updated;
  }

  async scanAndUpdateWithContext(
    id: string,
    data: {
      status?: PrismaPackageStatus;
      latitude?: number;
      longitude?: number;
      currentWarehouseId?: string;
      viewerType?: string;
    },
  ) {
    const updated = await this.scanAndUpdate(id, data);
    let shipment:
      | (Shipment & {
          carrier?: Carrier | null;
          origin?: Address | null;
          destination?: Address | null;
          currentWarehouse?: Warehouse | null;
          destinationWarehouse?: Warehouse | null;
          vehicle?: Vehicle | null;
          packages?: Package[];
          events?: TrackingEvent[];
        })
      | null = null;
    if (updated.shipmentId) {
      shipment = await this.prisma.shipment.findUnique({
        where: { id: updated.shipmentId },
        include: this.shipmentInclude,
      });
    }
    return this.buildContext(updated, shipment, data.viewerType);
  }
}
