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
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { ClientUserService } from './client-user.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('client-user')
@Controller('client-user')
export class ClientUserController {
  constructor(private readonly clientUserService: ClientUserService) {}

  @Post()
  @ApiOperation({ summary: 'Vincular usuario a cliente' })
  @ApiSuccessMessage('Vínculo creado correctamente')
  create(@Body() dto: CreateClientUserDto) {
    return this.clientUserService.create(dto);
  }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: 'Listar vínculos por clientId' })
  @ApiSuccessMessage('Listado de vínculos por cliente obtenido')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiOkResponse({ description: 'Listado paginado de vínculos de cliente' })
  findByClient(
    @Param('clientId') clientId: string,
    @Query() query: PaginationQueryDto,
  ) {
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
  findByUser(
    @Param('userId') userId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.clientUserService.findByUser(userId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar rol o desvincular usuario de cliente' })
  @ApiSuccessMessage('Vínculo actualizado correctamente')
  update(@Param('id') id: string, @Body() dto: UpdateClientUserDto) {
    return this.clientUserService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vínculo usuario-cliente' })
  @ApiSuccessMessage('Vínculo eliminado correctamente')
  remove(@Param('id') id: string) {
    return this.clientUserService.remove(id);
  }
}
