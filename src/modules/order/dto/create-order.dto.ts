import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OrderStatus {
  CANCELLED = 'CANCELLED',
  CONFIRMED = 'CONFIRMED',
  FULFILLED = 'FULFILLED',
  PENDING = 'PENDING',
}

export class CreateOrderDto {
  @ApiProperty({ description: 'ID del cliente (merchant) dueño de la orden' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({ description: 'ID del usuario (buyer) que compra' })
  @IsOptional()
  @IsString()
  buyerId?: string;

  @ApiPropertyOptional({ enum: OrderStatus, enumName: 'OrderStatus' })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Total numérico (decimal)',
    example: 129.99,
  })
  @IsOptional()
  @IsNumber()
  total?: number;

  @ApiPropertyOptional({
    description: 'Código de moneda ISO 4217',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
