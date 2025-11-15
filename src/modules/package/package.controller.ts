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
import { Roles } from 'src/common/decorators/roles.decorator';
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','WAREHOUSE','CARRIER','STORE')
  create(@Body() dto: CreatePackageDto) {
    return this.packageService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar paquetes' })
  @ApiSuccessMessage('Listado de paquetes obtenido')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','WAREHOUSE','CARRIER','CLIENT','USER','STORE')
  findAll(@Query() query: PackageListQueryDto) {
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
    @Req() req?: any,
  ) {
    return this.packageService.findByTrackingCodeWithContext(
      trackingCode,
      viewerType,
      req?.user,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle paquete (solo paquete)' })
  @ApiSuccessMessage('Paquete obtenido')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','CLIENT','WAREHOUSE','CARRIER','USER','STORE')
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }

  @Get(':id/context')
  @ApiOperation({ summary: 'Contexto completo filtrado por viewerType' })
  @ApiSuccessMessage('Contexto de paquete obtenido')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','CLIENT','USER','WAREHOUSE','CARRIER','STORE')
  findContext(
    @Param('id') id: string,
    @Query('viewerType') viewerType?: string,
    @Req() req?: any,
  ) {
    return this.packageService.findOneWithContext(id, viewerType, req?.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar paquete' })
  @ApiSuccessMessage('Paquete actualizado correctamente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN','WAREHOUSE','CARRIER','STORE')
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(id, dto);
  }

  @Patch(':id/scan')
  @ApiOperation({
    summary: 'Escanear QR y actualizar (retorna contexto filtrado)',
  })
  @ApiSuccessMessage('Paquete escaneado y actualizado')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WAREHOUSE','CARRIER','ADMIN','STORE')
  scan(
    @Param('id') id: string,
    @Body() body: ScanPackageDto & { viewerType?: string },
    @Query('viewerType') viewerType?: string,
    @Req() req?: any,
  ) {
    return this.packageService.scanAndUpdateWithContext(
      id,
      {
        ...body,
        viewerType,
      },
      req?.user,
      req,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar paquete' })
  @ApiSuccessMessage('Paquete eliminado correctamente')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
