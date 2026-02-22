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
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('role')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: 'Crear rol' })
  @ApiSuccessMessage('Rol creado correctamente')
  @Roles('ADMIN')
  create(@Body() dto: CreateRoleDto, @Req() req?: RequestWithUser) {
    return this.roleService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles' })
  @ApiSuccessMessage('Listado de roles obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle rol' })
  @ApiSuccessMessage('Rol obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiSuccessMessage('Rol actualizado correctamente')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.roleService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar rol' })
  @ApiSuccessMessage('Rol eliminado correctamente')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.roleService.remove(id, req?.user);
  }
}
