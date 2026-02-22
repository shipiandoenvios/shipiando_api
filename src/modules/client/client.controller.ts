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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('client')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cliente (merchant)' })
  @ApiSuccessMessage('Cliente creado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  create(@Body() dto: CreateClientDto, @Req() req?: RequestWithUser) {
    if (
      req?.user?.roles?.includes('CLIENT') &&
      req?.clientId &&
      'id' in dto &&
      req.clientId !== dto.id
    ) {
      throw new ForbiddenException('No autorizado para crear cliente');
    }
    return this.clientService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes (merchants)' })
  @ApiSuccessMessage('Listado de clientes obtenido')
  @Roles('ADMIN', 'CLIENT', 'WAREHOUSE', 'CARRIER', 'USER', 'STORE')
  findAll(@Query() query: PaginationQueryDto, @Req() req?: RequestWithUser) {
    return this.clientService.findAll(query, req?.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cliente por ID' })
  @ApiSuccessMessage('Cliente obtenido')
  @Roles('ADMIN', 'CLIENT', 'WAREHOUSE', 'CARRIER', 'USER', 'STORE')
  findOne(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.clientService.findOne(id, req?.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiSuccessMessage('Cliente actualizado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req?: RequestWithUser,
  ) {
    if (
      req?.user?.roles?.includes('CLIENT') &&
      req?.clientId &&
      req.clientId !== id
    ) {
      throw new ForbiddenException('No autorizado para modificar este cliente');
    }
    return this.clientService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cliente' })
  @ApiSuccessMessage('Cliente eliminado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    if (
      req?.user?.roles?.includes('CLIENT') &&
      req?.clientId &&
      req.clientId !== id
    ) {
      throw new ForbiddenException('No autorizado para eliminar este cliente');
    }
    return this.clientService.remove(id, req?.user);
  }
}
