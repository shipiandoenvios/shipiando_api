import {
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackingEventType } from '@prisma/client';

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
