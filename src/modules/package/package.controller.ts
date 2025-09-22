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
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import type { PackageStatus } from '@prisma/client';

class ScanPackageDto {
  status?: PackageStatus;
  latitude?: number;
  longitude?: number;
  currentWarehouseId?: string;
}

@ApiTags('package')
@Controller('package')
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Post()
  @ApiOperation({ summary: 'Crear paquete' })
  @ApiSuccessMessage('Paquete creado correctamente')
  create(@Body() dto: CreatePackageDto) {
    return this.packageService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar paquetes' })
  @ApiSuccessMessage('Listado de paquetes obtenido')
  findAll(@Query() query: PaginationQueryDto) {
    return this.packageService.findAll(query);
  }

  @Get('tracking/:trackingCode')
  @ApiOperation({
    summary:
      'Obtener contexto por trackingCode (paquete + shipment) con filtro por viewerType',
  })
  @ApiSuccessMessage('Contexto por trackingCode obtenido')
  getByTrackingCode(
    @Param('trackingCode') trackingCode: string,
    @Query('viewerType') viewerType?: string,
  ) {
    return this.packageService.findByTrackingCodeWithContext(
      trackingCode,
      viewerType,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle paquete (solo paquete)' })
  @ApiSuccessMessage('Paquete obtenido')
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }

  @Get(':id/context')
  @ApiOperation({ summary: 'Contexto completo filtrado por viewerType' })
  @ApiSuccessMessage('Contexto de paquete obtenido')
  findContext(
    @Param('id') id: string,
    @Query('viewerType') viewerType?: string,
  ) {
    return this.packageService.findOneWithContext(id, viewerType);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar paquete' })
  @ApiSuccessMessage('Paquete actualizado correctamente')
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(id, dto);
  }

  @Patch(':id/scan')
  @ApiOperation({
    summary: 'Escanear QR y actualizar (retorna contexto filtrado)',
  })
  @ApiSuccessMessage('Paquete escaneado y actualizado')
  scan(
    @Param('id') id: string,
    @Body() body: ScanPackageDto & { viewerType?: string },
    @Query('viewerType') viewerType?: string,
  ) {
    return this.packageService.scanAndUpdateWithContext(id, {
      ...body,
      viewerType,
    });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar paquete' })
  @ApiSuccessMessage('Paquete eliminado correctamente')
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
