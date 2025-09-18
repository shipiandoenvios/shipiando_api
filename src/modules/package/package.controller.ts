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
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('package')
@Controller('package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @ApiOperation({ summary: 'Crear paquete' })
  create(@Body() dto: CreatePackageDto) {
    return this.packageService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar paquetes' })
  findAll(@Query() query: PaginationQueryDto) {
    return this.packageService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle paquete' })
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar paquete' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar paquete' })
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
