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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('warehouse')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'WAREHOUSE', 'STORE')
@Controller('warehouse')
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @ApiOperation({ summary: 'Crear warehouse' })
  @ApiSuccessMessage('Warehouse creado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehouseService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar warehouses' })
  @ApiSuccessMessage('Listado de warehouses obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.warehouseService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle warehouse' })
  @ApiSuccessMessage('Warehouse obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar warehouse' })
  @ApiSuccessMessage('Warehouse actualizado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar warehouse' })
  @ApiSuccessMessage('Warehouse eliminado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  remove(@Param('id') id: string) {
    return this.warehouseService.remove(id);
  }
}
