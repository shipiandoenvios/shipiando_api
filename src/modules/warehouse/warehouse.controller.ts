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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('warehouse')
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @ApiOperation({ summary: 'Crear warehouse' })
  @ApiSuccessMessage('Warehouse creado correctamente')
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar warehouses' })
  @ApiSuccessMessage('Listado de warehouses obtenido')
  findAll(@Query() query: PaginationQueryDto) {
    return this.warehouseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle warehouse' })
  @ApiSuccessMessage('Warehouse obtenido')
  findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar warehouse' })
  @ApiSuccessMessage('Warehouse actualizado correctamente')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar warehouse' })
  @ApiSuccessMessage('Warehouse eliminado correctamente')
  remove(@Param('id') id: string) {
    return this.warehouseService.remove(id);
  }
}
