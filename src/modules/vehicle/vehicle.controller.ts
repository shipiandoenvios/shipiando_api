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
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('vehicle')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @ApiOperation({ summary: 'Crear vehículo' })
  @ApiSuccessMessage('Vehículo creado correctamente')
  @Roles('ADMIN', 'CARRIER', 'STORE')
  create(@Body() dto: CreateVehicleDto, @Req() req?: RequestWithUser) {
    return this.vehicleService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vehículos' })
  @ApiSuccessMessage('Listado de vehículos obtenido')
  @Roles('ADMIN', 'CARRIER', 'WAREHOUSE', 'CLIENT', 'USER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.vehicleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle vehículo' })
  @ApiSuccessMessage('Vehículo obtenido')
  @Roles('ADMIN', 'CARRIER', 'WAREHOUSE', 'CLIENT', 'USER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar vehículo' })
  @ApiSuccessMessage('Vehículo actualizado correctamente')
  @Roles('ADMIN', 'CARRIER', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.vehicleService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar vehículo' })
  @ApiSuccessMessage('Vehículo eliminado correctamente')
  @Roles('ADMIN', 'CARRIER', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.vehicleService.remove(id, req?.user);
  }
}
