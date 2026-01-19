import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  assertHasAnyRole,
  AppUser,
  assertClientMatches,
} from '../../common/permissions/permission.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import {
  PaginationQueryDto,
  PaginatedResult,
} from '../../common/dto/pagination-query.dto';
import { buildPaginatedResult } from '../../common/utils/pagination.util';
import type { Invoice } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { assertHasPermission } from 'src/common/permissions/abac.util';
import { logPolicyDenial } from '../../common/logging/audit.logger';

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(data: CreateInvoiceDto, user?: AppUser, clientId?: string) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    if (user) assertClientMatches(user, clientId);
    if (clientId && user?.roles?.includes('CLIENT')) {
      const order = await this.prisma.order.findUnique({
        where: { id: data.orderId },
      });
      if (!order || order.clientId !== clientId)
        throw new ForbiddenException(
          'No autorizado para crear factura para este pedido',
        );
    }

    // ABAC check for invoice creation
    try {
      if (user)
        assertHasPermission(user, 'invoice.create', 'invoice', {
          orderId: data.orderId,
          clientId,
        });
    } catch (e) {
      // audit denial
      try {
        logPolicyDenial({
          timestamp: new Date().toISOString(),
          userId: user?.id ?? null,
          action: 'invoice.create',
          resource: 'invoice',
          attrs: { orderId: data.orderId, clientId },
          reason: String(e),
          clientId,
        });
      } catch {
        /* empty */
      }
      // notify admins if configured
      try {
        const admins = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const a of admins) {
          await this.notificationService.sendNotification({
            to: a,
            subject: `Policy denial: invoice.create by ${user?.id ?? 'unknown'}`,
            message: `User ${user?.id ?? 'unknown'} was denied invoice.create for order ${data.orderId}. Reason: ${String(e)}. attrs=${JSON.stringify({ orderId: data.orderId, clientId })}`,
            channel: 'email',
            meta: {
              action: 'invoice.create',
              orderId: data.orderId,
              userId: user?.id ?? null,
            },
          });
        }
      } catch {
        /* empty */
      }
      throw e;
    }

    return this.prisma.invoice.create({ data });
  }

  async findAll(
    params?: PaginationQueryDto,
    clientId?: string,
  ): Promise<PaginatedResult<Invoice>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'asc',
    } = params || {};
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (clientId) where.order = { clientId };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        where,
      }),
    ]);
    return buildPaginatedResult(items, total, page, limit);
  }

  async findOne(id: string, clientId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (clientId && invoice.order?.clientId !== clientId)
      throw new ForbiddenException('No autorizado para ver este recurso');
    return invoice;
  }

  async update(
    id: string,
    data: UpdateInvoiceDto,
    user?: AppUser,
    clientId?: string,
  ) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT', 'STORE']);
    await this.findOne(id, clientId);

    // enforce tenant scoping
    if (user) assertClientMatches(user, clientId);

    // ABAC check
    try {
      if (user)
        assertHasPermission(user, 'invoice.update', 'invoice', {
          id,
          clientId,
        });
    } catch (e) {
      // audit denial
      try {
        logPolicyDenial({
          timestamp: new Date().toISOString(),
          userId: user?.id ?? null,
          action: 'invoice.update',
          resource: 'invoice',
          attrs: { id, clientId },
          reason: String(e),
          clientId,
        });
      } catch {
        /* empty */
      }
      // notify admins if configured
      try {
        const admins = (process.env.ADMIN_NOTIFICATION_EMAILS || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const a of admins) {
          await this.notificationService.sendNotification({
            to: a,
            subject: `Policy denial: invoice.update by ${user?.id ?? 'unknown'}`,
            message: `User ${user?.id ?? 'unknown'} was denied invoice.update on invoice ${id}. Reason: ${String(e)}. attrs=${JSON.stringify({ id, clientId })}`,
            channel: 'email',
            meta: {
              action: 'invoice.update',
              invoiceId: id,
              userId: user?.id ?? null,
            },
          });
        }
      } catch {
        /* empty */
      }
      throw e;
    }

    return this.prisma.invoice.update({ where: { id }, data });
  }

  async remove(id: string, user?: AppUser, clientId?: string) {
    if (user) assertHasAnyRole(user, ['ADMIN', 'CLIENT']);
    await this.findOne(id, clientId);
    return this.prisma.invoice.delete({ where: { id } });
  }
}
