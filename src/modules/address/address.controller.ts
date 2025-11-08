import { Roles } from '../../common/decorators/roles.decorator';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('address')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiOperation({ summary: 'Crear dirección' })
  @ApiSuccessMessage('Dirección creada correctamente')
  @Roles('ADMIN', 'CLIENT', 'USER', 'STORE')
  create(@Body() dto: CreateAddressDto) {
    return this.addressService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar direcciones' })
  @ApiSuccessMessage('Listado de direcciones obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.addressService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener dirección por ID' })
  @ApiSuccessMessage('Dirección obtenida')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar dirección' })
  @ApiSuccessMessage('Dirección actualizada correctamente')
  @Roles('ADMIN', 'CLIENT', 'USER', 'STORE')
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar dirección' })
  @ApiSuccessMessage('Dirección eliminada correctamente')
  @Roles('ADMIN', 'CLIENT', 'USER', 'STORE')
  remove(@Param('id') id: string) {
    return this.addressService.remove(id);
  }
}
