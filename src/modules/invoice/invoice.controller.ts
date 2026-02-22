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
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';

@ApiTags('invoice')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Crear factura' })
  @ApiSuccessMessage('Factura creada correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  create(@Body() dto: CreateInvoiceDto, @Req() req?: RequestWithUser) {
    return this.invoiceService.create(dto, req?.user, req?.clientId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas' })
  @ApiSuccessMessage('Listado de facturas obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto, @Req() req?: RequestWithUser) {
    return this.invoiceService.findAll(query, req?.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle factura' })
  @ApiSuccessMessage('Factura obtenida')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.invoiceService.findOne(id, req?.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar factura' })
  @ApiSuccessMessage('Factura actualizada correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.invoiceService.update(id, dto, req?.user, req?.clientId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar factura' })
  @ApiSuccessMessage('Factura eliminada correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.invoiceService.remove(id, req?.user, req?.clientId);
  }
}
