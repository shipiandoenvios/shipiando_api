import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PackageStatus } from '@prisma/client';

export class PackageListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  declare search?: string;

  @IsOptional()
  @IsEnum(PackageStatus)
  status?: PackageStatus;

  @IsOptional()
  @IsString()
  shipmentId?: string;

  @IsOptional()
  @IsString()
  currentWarehouseId?: string;

  @IsOptional()
  @IsString()
  tracking?: string;
}
