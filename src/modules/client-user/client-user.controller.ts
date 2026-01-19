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
import { Request } from 'express';
import { AppUser } from '../../common/permissions/permission.util';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { ClientUserService } from './client-user.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('client-user')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('client-user')
export class ClientUserController {
  constructor(private readonly clientUserService: ClientUserService) {}

  @Post()
  @ApiOperation({ summary: 'Vincular usuario a cliente' })
  @ApiSuccessMessage('Vínculo creado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  create(@Body() dto: CreateClientUserDto, @Req() req?: RequestWithUser) {
    const user = req?.user;
    return this.clientUserService.create(dto, user);
  }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: 'Listar vínculos por clientId' })
  @ApiSuccessMessage('Listado de vínculos por cliente obtenido')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Listado paginado de vínculos de cliente' })
  @Roles('ADMIN', 'CLIENT', 'WAREHOUSE', 'CARRIER', 'USER', 'STORE')
  findByClient(
    @Param('clientId') clientId: string,
    @Query() query: PaginationQueryDto,
    @Req() req?: Request & { user?: AppUser },
  ) {
    const user = req?.user;
    const clientIdFromUser =
      user && 'clientId' in user ? user.clientId : undefined;
    if (
      clientIdFromUser &&
      user?.roles?.includes('CLIENT') &&
      clientIdFromUser !== clientId
    ) {
      throw new ForbiddenException('No autorizado para ver este recurso');
    }
    return this.clientUserService.findByClient(clientId, query);
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Listar vínculos por userId' })
  @ApiSuccessMessage('Listado de vínculos por usuario obtenido')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Listado paginado de vínculos de usuario' })
  @Roles('ADMIN', 'CLIENT', 'WAREHOUSE', 'CARRIER', 'USER', 'STORE')
  findByUser(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.clientUserService.findByUser(userId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar rol o desvincular usuario de cliente' })
  @ApiSuccessMessage('Vínculo actualizado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientUserDto,
    @Req() req?: Request & { user?: AppUser },
  ) {
    const user = req?.user;
    return this.clientUserService.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vínculo usuario-cliente' })
  @ApiSuccessMessage('Vínculo eliminado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    const user = req?.user;
    return this.clientUserService.remove(id, user);
  }
}
