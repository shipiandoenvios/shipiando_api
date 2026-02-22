import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
import { RequestWithUser } from '../../common/permissions/permission.util';

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
  create(@Body() dto: CreateWarehouseDto, @Req() req?: RequestWithUser) {
    if (req?.clientId && req?.user?.roles?.includes('CLIENT'))
      dto.clientId = req.clientId;
    return this.warehouseService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar warehouses' })
  @ApiSuccessMessage('Listado de warehouses obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findAll(@Query() query: PaginationQueryDto, @Req() req?: RequestWithUser) {
    return this.warehouseService.findAll(query, req?.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle warehouse' })
  @ApiSuccessMessage('Warehouse obtenido')
  @Roles('ADMIN', 'WAREHOUSE', 'CARRIER', 'CLIENT', 'USER', 'STORE')
  findOne(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.warehouseService.findOne(id, req?.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar warehouse' })
  @ApiSuccessMessage('Warehouse actualizado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWarehouseDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.warehouseService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar warehouse' })
  @ApiSuccessMessage('Warehouse eliminado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.warehouseService.remove(id, req?.user);
  }
}
