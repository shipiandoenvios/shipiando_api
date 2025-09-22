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
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { BulkUpdateShipmentPackagesDto } from './dto/bulk-update-shipment-packages.dto';

@ApiTags('shipment')
@Controller('shipment')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Crear envío' })
  @ApiSuccessMessage('Envío creado correctamente')
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar envíos' })
  @ApiSuccessMessage('Listado de envíos obtenido')
  findAll(@Query() query: PaginationQueryDto) {
    return this.shipmentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle envío' })
  @ApiSuccessMessage('Envío obtenido')
  findOne(@Param('id') id: string) {
    return this.shipmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar envío' })
  @ApiSuccessMessage('Envío actualizado correctamente')
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipmentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar envío' })
  @ApiSuccessMessage('Envío eliminado correctamente')
  remove(@Param('id') id: string) {
    return this.shipmentService.remove(id);
  }

  @Patch(':id/packages/bulk-update')
  @ApiOperation({
    summary: 'Actualizar en bloque todos los paquetes de un shipment',
  })
  @ApiSuccessMessage('Paquetes del envío actualizados correctamente')
  bulkUpdatePackages(
    @Param('id') id: string,
    @Body() dto: BulkUpdateShipmentPackagesDto,
  ) {
    return this.shipmentService.bulkUpdatePackages(id, dto);
  }
}
