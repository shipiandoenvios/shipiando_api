import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import {
  AddressModule,
  CarrierModule,
  ClientModule,
  InventoryModule,
  InvoiceModule,
  OrderModule,
  PackageModule,
  ProductCategoryModule,
  ProductModule,
  RoleModule,
  ShipmentModule,
  TrackingEventModule,
  UserModule,
  VehicleModule,
  WarehouseModule,
} from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AddressModule,
    CarrierModule,
    ClientModule,
    InventoryModule,
    InvoiceModule,
    OrderModule,
    PackageModule,
    PrismaModule,
    ProductCategoryModule,
    ProductModule,
    RoleModule,
    ShipmentModule,
    TrackingEventModule,
    UserModule,
    VehicleModule,
    WarehouseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
