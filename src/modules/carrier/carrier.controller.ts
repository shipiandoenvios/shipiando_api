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
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CarrierService } from './carrier.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { UpdateCarrierDto } from './dto/update-carrier.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('carrier')
@Controller('carrier')
export class CarrierController {
  constructor(private readonly carrierService: CarrierService) {}

  @Post()
  @ApiOperation({ summary: 'Crear carrier' })
  create(@Body() dto: CreateCarrierDto) {
    return this.carrierService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar carriers' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.carrierService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener carrier por ID' })
  findOne(@Param('id') id: string) {
    return this.carrierService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar carrier' })
  update(@Param('id') id: string, @Body() body: UpdateCarrierDto) {
    return this.carrierService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar carrier' })
  remove(@Param('id') id: string) {
    return this.carrierService.remove(id);
  }
}
