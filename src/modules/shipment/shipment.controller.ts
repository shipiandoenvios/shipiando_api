import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BulkUpdateShipmentPackagesDto } from './dto/bulk-update-shipment-packages.dto';

@ApiTags('shipment')
@Controller('shipment')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Crear envío' })
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar envíos' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.shipmentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle envío' })
  findOne(@Param('id') id: string) {
    return this.shipmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar envío' })
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipmentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar envío' })
  remove(@Param('id') id: string) {
    return this.shipmentService.remove(id);
  }

  @Patch(':id/packages/bulk-update')
  @ApiOperation({ summary: 'Actualizar en bloque todos los paquetes de un shipment' })
  bulkUpdatePackages(
    @Param('id') id: string,
    @Body() dto: BulkUpdateShipmentPackagesDto,
  ) {
    return this.shipmentService.bulkUpdatePackages(id, dto);
  }
}
