import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PackageStatus } from '@prisma/client';

export class BulkUpdateShipmentPackagesDto {
  @ApiPropertyOptional({ enum: PackageStatus })
  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currentWarehouseId?: string;

  @ApiPropertyOptional({ example: -34.6 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -58.38 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
