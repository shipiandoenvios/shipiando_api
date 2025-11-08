import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { UpdateShipmentDto } from './dto/update-shipment.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { BulkUpdateShipmentPackagesDto } from './dto/bulk-update-shipment-packages.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('shipment')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('shipment')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post()
  @ApiOperation({ summary: 'Crear envío' })
  @ApiSuccessMessage('Envío creado correctamente')
  @Roles('ADMIN','WAREHOUSE','CARRIER','STORE')
  create(@Body() dto: CreateShipmentDto) {
    return this.shipmentService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar envíos' })
  @ApiSuccessMessage('Listado de envíos obtenido')
  @Roles('ADMIN','WAREHOUSE','CARRIER','CLIENT','USER','STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.shipmentService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle envío' })
  @ApiSuccessMessage('Envío obtenido')
  @Roles('ADMIN','WAREHOUSE','CARRIER','CLIENT','USER','STORE')
  findOne(@Param('id') id: string) {
    return this.shipmentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar envío' })
  @ApiSuccessMessage('Envío actualizado correctamente')
  @Roles('ADMIN','WAREHOUSE','CARRIER','STORE')
  update(@Param('id') id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipmentService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar envío' })
  @ApiSuccessMessage('Envío eliminado correctamente')
  @Roles('ADMIN','WAREHOUSE','CARRIER','STORE')
  remove(@Param('id') id: string) {
    return this.shipmentService.remove(id);
  }

  @Patch(':id/packages/bulk-update')
  @ApiOperation({
    summary: 'Actualizar en bloque todos los paquetes de un shipment',
  })
  @ApiSuccessMessage('Paquetes del envío actualizados correctamente')
  @Roles('ADMIN','WAREHOUSE','CARRIER')
  bulkUpdatePackages(
    @Param('id') id: string,
    @Body() dto: BulkUpdateShipmentPackagesDto,
  ) {
    return this.shipmentService.bulkUpdatePackages(id, dto);
  }
}
