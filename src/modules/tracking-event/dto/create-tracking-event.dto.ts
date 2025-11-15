import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Enum alineado con el frontend y contratos compartidos
export enum TrackingEventType {
  CREATED = 'CREATED',
  LABEL_PRINTED = 'LABEL_PRINTED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  HUB_TRANSFER = 'HUB_TRANSFER',
  IN_WAREHOUSE = 'IN_WAREHOUSE',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  DELAYED = 'DELAYED',
  EXCEPTION = 'EXCEPTION',
  RETURN_INITIATED = 'RETURN_INITIATED',
  RETURNED = 'RETURNED',
}

export class CreateTrackingEventDto {
  @ApiProperty({ description: 'Código legible (ej: EVT-001)' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'ID del shipment' })
  @IsString()
  shipmentId: string;

  @ApiProperty({ enum: TrackingEventType, enumName: 'TrackingEventType' })
  @IsEnum(TrackingEventType)
  type: TrackingEventType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Descripción de localización' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Fecha/hora del evento ISO8601' })
  @IsOptional()
  @IsDateString()
  eventAt?: string;

  @ApiPropertyOptional({ example: -34.6037 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: -58.3816 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
