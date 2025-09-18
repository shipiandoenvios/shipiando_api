import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceStatus {
  CANCELLED = 'CANCELLED',
  PAID = 'PAID',
  PENDING = 'PENDING',
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 199.99 })
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  orderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus, enumName: 'InvoiceStatus' })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
