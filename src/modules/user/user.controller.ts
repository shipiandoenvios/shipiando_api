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
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('user')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiSuccessMessage('Usuario creado correctamente')
  @Roles('ADMIN', 'USER')
  create(@Body() dto: CreateUserDto, @Req() req?: RequestWithUser) {
    return this.userService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiSuccessMessage('Listado de usuarios obtenido')
  @Roles('ADMIN', 'USER', 'CLIENT', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle usuario' })
  @ApiSuccessMessage('Usuario obtenido')
  @Roles('ADMIN', 'USER', 'CLIENT', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiSuccessMessage('Usuario actualizado correctamente')
  @Roles('ADMIN', 'USER')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.userService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiSuccessMessage('Usuario eliminado correctamente')
  @Roles('ADMIN', 'USER')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.userService.remove(id, req?.user);
  }
}
