import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ShipmentStatus {
  CANCELLED = 'CANCELLED',
  CREATED = 'CREATED',
  DELIVERED = 'DELIVERED',
  IN_TRANSIT = 'IN_TRANSIT',
  RETURNED = 'RETURNED',
}

export class CreateShipmentDto {
  @ApiPropertyOptional({ description: 'Carrier asignado' })
  @IsOptional()
  @IsString()
  carrierId?: string;

  @ApiPropertyOptional({ description: 'Dirección origen' })
  @IsOptional()
  @IsString()
  originId?: string;

  @ApiPropertyOptional({ description: 'Dirección destino' })
  @IsOptional()
  @IsString()
  destinationId?: string;

  @ApiPropertyOptional({ description: 'Warehouse actual' })
  @IsOptional()
  @IsString()
  currentWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Warehouse destino intermedio' })
  @IsOptional()
  @IsString()
  destinationWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Warehouse inicial asociado' })
  @IsOptional()
  @IsString()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Vehículo asignado' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Tracking externo del carrier' })
  @IsOptional()
  @IsString()
  externalTrackingCode?: string;

  @ApiPropertyOptional({ enum: ShipmentStatus, enumName: 'ShipmentStatus' })
  @IsOptional()
  @IsEnum(ShipmentStatus)
  status?: ShipmentStatus;

  @ApiPropertyOptional({ description: 'Fecha de despacho' })
  @IsOptional()
  @IsDateString()
  shippedAt?: string;

  @ApiPropertyOptional({ description: 'Fecha de entrega' })
  @IsOptional()
  @IsDateString()
  deliveredAt?: string;
}
