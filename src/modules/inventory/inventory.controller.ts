import { Roles } from '../../common/decorators/roles.decorator';
import { RequestWithUser } from '../../common/permissions/permission.util';
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
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Crear inventario' })
  @ApiSuccessMessage('Inventario creado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  create(@Body() dto: CreateInventoryDto, @Req() req?: RequestWithUser) {
    return this.inventoryService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar inventarios' })
  @ApiSuccessMessage('Listado de inventarios obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto, @Req() req?: RequestWithUser) {
    return this.inventoryService.findAll(query, req?.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle inventario' })
  @ApiSuccessMessage('Inventario obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.inventoryService.findOne(id, req?.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar inventario' })
  @ApiSuccessMessage('Inventario actualizado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.inventoryService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar inventario' })
  @ApiSuccessMessage('Inventario eliminado correctamente')
  @Roles('ADMIN', 'WAREHOUSE', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.inventoryService.remove(id, req?.user);
  }
}
