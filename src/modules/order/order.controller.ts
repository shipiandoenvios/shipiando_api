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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('order')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Crear orden' })
  @ApiSuccessMessage('Orden creada correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  create(@Body() dto: CreateOrderDto, @Req() req?: RequestWithUser) {
    // If req.clientId present and user is CLIENT, force order.clientId
    if (req?.clientId && req?.user?.roles?.includes('CLIENT')) {
      dto.clientId = req.clientId;
    }
    return this.orderService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar órdenes' })
  @ApiSuccessMessage('Listado de órdenes obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto, @Req() req?: RequestWithUser) {
    return this.orderService.findAll(query, req?.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle orden' })
  @ApiSuccessMessage('Orden obtenida')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.orderService.findOne(id, req?.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar orden' })
  @ApiSuccessMessage('Orden actualizada correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.orderService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar orden' })
  @ApiSuccessMessage('Orden eliminada correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.orderService.remove(id, req?.user);
  }
}
