import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import {
  AddressModule,
  CarrierModule,
  AuthModule,
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
  ClientUserModule,
  PermissionsModule,
} from './modules';
import { ThrottlerModule } from '@nestjs/throttler';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    AddressModule,
    CarrierModule,
    ClientModule,
    InventoryModule,
    InvoiceModule,
    OrderModule,
    PackageModule,
    PrismaModule,
    AuthModule,
    ProductCategoryModule,
    PermissionsModule,
    ProductModule,
    RoleModule,
    ShipmentModule,
    TrackingEventModule,
    UserModule,
    VehicleModule,
    WarehouseModule,
    ClientUserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
