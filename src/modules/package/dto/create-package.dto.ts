import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum PackageStatus {
  CREATED = 'CREATED',
  AWAITING_CHECKIN = 'AWAITING_CHECKIN',
  AT_ORIGIN = 'AT_ORIGIN',
  IN_WAREHOUSE = 'IN_WAREHOUSE',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
  EXCEPTION = 'EXCEPTION',
}

export class CreatePackageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipmentId?: string;

  @ApiPropertyOptional({ description: 'Tracking interno asignado' })
  @IsOptional()
  @IsString()
  trackingCode?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  heightCm?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  lengthCm?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  widthCm?: number;

  @ApiPropertyOptional({ example: 2.5 })
  @IsOptional()
  @IsNumber()
  weightKg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  originId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentWarehouseId?: string;

  @ApiPropertyOptional({ enum: PackageStatus, enumName: 'PackageStatus' })
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @ApiPropertyOptional({ description: 'Override timestamp status' })
  @IsOptional()
  @IsDateString()
  lastStatusAt?: string;

  @ApiPropertyOptional({ example: -34.6 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -58.38 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
