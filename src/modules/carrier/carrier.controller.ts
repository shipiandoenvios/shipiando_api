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
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CarrierService } from './carrier.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('carrier')
@Controller('carrier')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Post()
  @ApiOperation({ summary: 'Crear carrier' })
  @ApiSuccessMessage('Carrier creado correctamente')
  @Roles('ADMIN', 'CARRIER')
  create(@Body() dto: CreateCarrierDto, @Req() req?: RequestWithUser) {
    return this.carrierService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar carriers' })
  @ApiSuccessMessage('Listado de carriers obtenido')
  @Roles('ADMIN', 'CARRIER', 'WAREHOUSE', 'CLIENT', 'USER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.carrierService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener carrier por ID' })
  @ApiSuccessMessage('Carrier obtenido')
  @Roles('ADMIN', 'CARRIER', 'WAREHOUSE', 'CLIENT', 'USER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.carrierService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar carrier' })
  @ApiSuccessMessage('Carrier actualizado correctamente')
  @Roles('ADMIN', 'CARRIER')
  update(
    @Param('id') id: string,
    @Body() body: UpdateCarrierDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.carrierService.update(id, body, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar carrier' })
  @ApiSuccessMessage('Carrier eliminado correctamente')
  @Roles('ADMIN', 'CARRIER')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.carrierService.remove(id, req?.user);
  }
}
