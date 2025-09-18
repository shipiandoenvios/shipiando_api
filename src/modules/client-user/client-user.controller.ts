import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClientUserService } from './client-user.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';

@ApiTags('client-user')
@Controller('client-user')
export class ClientUserController {
  constructor(private readonly clientUserService: ClientUserService) {}

  @Post()
  @ApiOperation({ summary: 'Vincular usuario a cliente' })
  create(@Body() dto: CreateClientUserDto) {
    return this.clientUserService.create(dto);
  }

  @Get('by-client/:clientId')
  @ApiOperation({ summary: 'Listar vínculos por clientId' })
  findByClient(@Param('clientId') clientId: string) {
    return this.clientUserService.findByClient(clientId);
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Listar vínculos por userId' })
  findByUser(@Param('userId') userId: string) {
    return this.clientUserService.findByUser(userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar rol o desvincular usuario de cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateClientUserDto) {
    return this.clientUserService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vínculo usuario-cliente' })
  remove(@Param('id') id: string) {
    return this.clientUserService.remove(id);
  }
}
