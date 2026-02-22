import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
  assertClientMatches,
} from '../../common/permissions/permission.util';
import { assertHasPermission } from '../../common/permissions/abac.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PaginatedResult } from 'src/common/dto/pagination-query.dto';
import { PackageListQueryDto } from './dto/package-list-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import { randomBytes } from 'crypto';
import { NotificationService } from '../notification/notification.service';
import { logPackageStatusChangeLegacy } from './audit-log.util';
import { logPolicyDenial } from '../../common/logging/audit.logger';
import { isStatusTransitionAllowed } from './status-transition.util';
import { assertCanTransition } from './status-transition-permissions.util';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

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

  async create(data: CreatePackageDto, user?: AppUser, clientId?: string) {
    // Service-level RBAC: if a user is provided, verify they can create packages
    if (user)
      assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER', 'STORE']);

    // Enforce tenant scope: if caller is CLIENT, ensure clientId matches and bind it
    if (user) assertClientMatches(user, clientId);
    if (user?.roles?.includes('CLIENT') && 'clientId' in user) {
      const boundClient = user.clientId;
      data.clientId = boundClient ?? clientId ?? data.clientId;
    } else if (clientId && !data.clientId) {
      data.clientId = clientId;
    }

    // If caller is CLIENT and clientId provided, ensure the referenced order belongs to that client
    if (clientId && user?.roles?.includes('CLIENT') && data.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: data.orderId },
      });
      if (!order || order.clientId !== clientId) {
        throw new ForbiddenException(
          'No autorizado para crear paquete para este pedido',
        );
      }
    }

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
      data.status = PrismaPackageStatus.CREATED;
    }
    return this.prisma.package.create({ data });
  }

  async findAll(
    params?: PackageListQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Package>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
      search,
      status,
      shipmentId,
      currentWarehouseId,
      tracking,
    } = params || {};
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { trackingCode: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
        { origin: { city: { contains: search, mode: 'insensitive' } } },
        { destination: { city: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (shipmentId) where.shipmentId = shipmentId;
    if (currentWarehouseId) where.currentWarehouseId = currentWarehouseId;
    if (tracking) where.trackingCode = tracking;
    if (clientId) where.order = { clientId };
    const [total, items] = await this.prisma.$transaction(async (tx) => {
      const t = await tx.package.count({ where });
      const i = await tx.package.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      });
      return [t, i] as const;
    });
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    if (clientId && pkg.order?.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return pkg;
  }

  async findOneWithContext(
    id: string,
    viewerType?: string,
    user?: { id: string; roles?: string[] },
    clientId?: string,
  ) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: { origin: true, destination: true, order: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    if (clientId && pkg.order?.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
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
    // Si se solicita un viewerType sensible, validar permisos
    const vt = (viewerType || 'PUBLIC').toUpperCase();
    if (['WAREHOUSE', 'CARRIER', 'CLIENT', 'USER'].includes(vt)) {
      if (!user || !user.roles || !Array.isArray(user.roles)) {
        throw new ForbiddenException('No autorizado para ver este contexto');
      }
      const roleMap: Record<string, string[]> = {
        WAREHOUSE: ['WAREHOUSE', 'ADMIN'],
        CARRIER: ['CARRIER', 'ADMIN'],
        CLIENT: ['CLIENT', 'ADMIN'],
        USER: ['USER', 'CLIENT', 'ADMIN'],
      };
      const allowed = roleMap[vt];
      if (!allowed.some((r) => user.roles!.includes(r))) {
        throw new ForbiddenException('No autorizado para ver este contexto');
      }
    }
    return this.buildContext(pkg, shipment, viewerType);
  }

  async findByTrackingCode(trackingCode: string, clientId?: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { trackingCode },
      include: { order: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    if (clientId && pkg.order?.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return pkg;
  }

  async findByTrackingCodeWithContext(
    trackingCode: string,
    viewerType?: string,
    user?: { id: string; roles?: string[] },
    clientId?: string,
  ) {
    const pkg = await this.prisma.package.findUnique({
      where: { trackingCode },
      include: { origin: true, destination: true, order: true },
    });
    if (!pkg) throw new NotFoundException('Package not found');
    if (clientId && pkg.order?.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
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
    // validar viewerType y user igual que en findOneWithContextForUser
    const vt = (viewerType || 'PUBLIC').toUpperCase();
    if (['WAREHOUSE', 'CARRIER', 'CLIENT', 'USER'].includes(vt)) {
      if (!user || !user.roles || !Array.isArray(user.roles)) {
        throw new ForbiddenException('No autorizado para ver este contexto');
      }
      const roleMap: Record<string, string[]> = {
        WAREHOUSE: ['WAREHOUSE', 'ADMIN'],
        CARRIER: ['CARRIER', 'ADMIN'],
        CLIENT: ['CLIENT', 'ADMIN'],
        USER: ['USER', 'CLIENT', 'ADMIN'],
      };
      const allowed = roleMap[vt];
      if (!allowed.some((r) => user.roles!.includes(r))) {
        throw new ForbiddenException('No autorizado para ver este contexto');
      }
    }
    return this.buildContext(pkg, shipment, viewerType);
  }

  async update(
    id: string,
    data: UpdatePackageDto,
    user?: AppUser,
    clientId?: string,
  ) {
    // Service-level RBAC: if a user is provided, verify they can update packages
    if (user)
      assertHasAnyRole(user, ['ADMIN', 'WAREHOUSE', 'CARRIER', 'STORE']);

    const pkg = await this.findOne(id, clientId);

    // Enforce tenant scoping
    if (user) assertClientMatches(user, clientId);

    // ABAC: evaluate permission to update this package based on current attributes
    if (user) {
      try {
        assertHasPermission(user, 'package.update', 'package', {
          status: pkg.status,
          clientId: pkg.order?.clientId,
        });
      } catch (e) {
        // Audit denial
        try {
          logPolicyDenial({
            timestamp: new Date().toISOString(),
            userId: user?.id ?? null,
            action: 'package.update',
            resource: 'package',
            attrs: { id, status: pkg.status, clientId: pkg.order?.clientId },
            reason: String(e),
            clientId: pkg.order?.clientId,
          });
        } catch {
          /* non-fatal */
        }
        // Notify admins if configured
        try {
          const admins = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
          for (const a of admins) {
            await this.notificationService.sendNotification({
              to: a,
              subject: `Policy denial: package.update by ${user?.id ?? 'unknown'}`,
              message: `User ${user?.id ?? 'unknown'} was denied package.update on package ${id}. Reason: ${String(e)}. attrs=${JSON.stringify({ status: pkg.status, clientId: pkg.order?.clientId })}`,
              channel: 'email',
              meta: {
                action: 'package.update',
                packageId: id,
                userId: user?.id ?? null,
              },
            });
          }
        } catch {
          /* non-fatal */
        }
        throw e; // rethrow ForbiddenException from policy engine
      }
    }

    // If status change is requested, validate transition and role-per-transition
    if (data.status && data.status !== pkg.status) {
      if (!isStatusTransitionAllowed(pkg.status, data.status)) {
        throw new BadRequestException(
          `Transición de estado no permitida: ${pkg.status} → ${data.status}`,
        );
      }
      if (user) {
        assertCanTransition(user, String(pkg.status), String(data.status));
      }
    }

    return this.prisma.package.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser, clientId?: string) {
    // Service-level RBAC: if a user is provided, only ADMIN can delete
    if (user) assertHasAnyRole(user, ['ADMIN']);

    await this.findOne(id, clientId);
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
    auditContext?: { userId?: string | null; ip?: string; userAgent?: string },
    user?: { id?: string; roles?: string[] },
    clientId?: string,
  ) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
      include: {
        order: { include: { client: true } },
      },
    });
    if (!pkg) throw new NotFoundException('Paquete no encontrado');
    if (clientId && pkg.order?.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    const previousStatus = pkg.status;
    // Validar transición de estado si aplica
    if (data.status && data.status !== previousStatus) {
      if (!isStatusTransitionAllowed(previousStatus, data.status)) {
        throw new BadRequestException(
          `Transición de estado no permitida: ${previousStatus} → ${data.status}`,
        );
      }
      // Validar que el usuario (si se proporciona) tiene permisos para esta transición
      if (user) {
        // If user is provided, check allowed roles for transition
        assertCanTransition(user, String(previousStatus), String(data.status));
      }
    }

    // Additional ABAC check for scan/update flows
    if (user) {
      assertClientMatches(user, clientId);
      assertHasPermission(user, 'package.update', 'package', {
        status: previousStatus,
        clientId: pkg.order?.clientId,
      });
    }
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
      // --- AUDITORÍA ---
      logPackageStatusChangeLegacy({
        timestamp: new Date().toISOString(),
        userId: auditContext?.userId ?? null,
        packageId: pkg.id,
        previousStatus: previousStatus,
        newStatus: data.status,
        ip: auditContext?.ip,
        userAgent: auditContext?.userAgent,
      });

      await this.createTrackingEventForPackage({
        shipmentId: updated.shipmentId,
        status: data.status,
        latitude: updated.latitude ?? undefined,
        longitude: updated.longitude ?? undefined,
      });

      // Notificación automática al vendedor
      const statusLabel = data.status;
      const subject = `Actualización de estado de tu paquete`;

      // Notificar vendedor/cliente (si tiene email/teléfono)
      if (pkg.order?.client) {
        if (pkg.order.client.email) {
          await this.notificationService.sendNotification({
            to: pkg.order.client.email,
            subject,
            message: `El estado de un paquete de tu cliente ha cambiado a: ${statusLabel}`,
            channel: 'email',
            meta: { packageId: pkg.id, status: data.status },
          });
        }
        if (pkg.order.client.phone) {
          await this.notificationService.sendNotification({
            to: pkg.order.client.phone,
            message: `El estado de un paquete de tu cliente ha cambiado a: ${statusLabel}`,
            channel: 'sms',
            meta: { packageId: pkg.id, status: data.status },
          });
        }
        const clientPushToken = (pkg.order.client as { pushToken?: string })
          ?.pushToken;
        if (clientPushToken) {
          await this.notificationService.sendNotification({
            to: clientPushToken,
            message: `El estado de un paquete de tu cliente ha cambiado a: ${statusLabel}`,
            channel: 'push',
            meta: { packageId: pkg.id, status: data.status },
          });
        }
      }
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
    user?: { id: string; roles?: string[] },
    req?: { ip?: string; headers?: Record<string, unknown>; clientId?: string },
  ) {
    // Validar que el usuario autenticado puede realizar escaneo/actualización
    const vt = (data.viewerType || '').toUpperCase();
    if (!user || !user.roles) {
      throw new ForbiddenException('No autorizado');
    }
    // Solo WAREHOUSE o CARRIER (o ADMIN) pueden actualizar por escaneo
    const allowed = ['WAREHOUSE', 'CARRIER', 'ADMIN'];
    const has = user.roles.some((r) => allowed.includes(r));
    if (!has) {
      throw new ForbiddenException(
        'No autorizado: solo warehouse/carrier pueden modificar estado por escaneo',
      );
    }
    // Si viewerType está presente, validar que coincide con rol o es ADMIN
    if (vt) {
      if (!['WAREHOUSE', 'CARRIER'].includes(vt) && vt !== 'ADMIN') {
        throw new BadRequestException('viewerType inválido para escaneo');
      }
      if (vt !== 'ADMIN' && !user.roles.includes(vt)) {
        throw new ForbiddenException(
          'viewerType no coincide con roles del usuario',
        );
      }
    }
    const ip =
      req?.ip ||
      req?.headers?.['x-forwarded-for'] ||
      req?.headers?.['x-real-ip'];
    const userAgent =
      typeof req?.headers?.['user-agent'] === 'string'
        ? req.headers['user-agent']
        : Array.isArray(req?.headers?.['user-agent'])
          ? String(req.headers['user-agent'][0])
          : undefined;
    try {
      if (user)
        assertHasPermission(user, 'package.scan', 'package', {
          viewerType: vt,
          clientId: req?.clientId,
        });
    } catch (e) {
      try {
        logPolicyDenial({
          timestamp: new Date().toISOString(),
          userId: user?.id ?? null,
          action: 'package.scan',
          resource: 'package',
          attrs: { id, viewerType: vt, clientId: req?.clientId },
          reason: String(e),
          clientId: req?.clientId,
        });
      } catch {
        // non-fatal
      }
      try {
        const admins = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const a of admins) {
          await this.notificationService.sendNotification({
            to: a,
            subject: `Policy denial: package.scan by ${user?.id ?? 'unknown'}`,
            message: `User ${user?.id ?? 'unknown'} was denied package.scan on package ${id}. Reason: ${String(e)}. attrs=${JSON.stringify({ viewerType: vt, clientId: req?.clientId })}`,
            channel: 'email',
            meta: {
              action: 'package.scan',
              packageId: id,
              userId: user?.id ?? null,
            },
          });
        }
      } catch {
        /* non-fatal */
      }
      throw e;
    }

    const updated = await this.scanAndUpdate(
      id,
      data,
      {
        userId: user.id,
        ip:
          typeof ip === 'string'
            ? ip
            : Array.isArray(ip)
              ? String(ip[0])
              : undefined,
        userAgent,
      },
      user,
      req?.clientId,
    );

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
