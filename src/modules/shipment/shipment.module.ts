import { Module } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [NotificationModule, PrismaModule],
  providers: [ShipmentService],
  controllers: [ShipmentController],
})
export class ShipmentModule {}
