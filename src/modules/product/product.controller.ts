import { Roles } from '../../common/decorators/roles.decorator';
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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';
import { RequestWithUser } from '../../common/permissions/permission.util';

@ApiTags('product')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  @ApiSuccessMessage('Producto creado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  create(@Body() dto: CreateProductDto, @Req() req?: RequestWithUser) {
    if (req?.clientId && req?.user?.roles?.includes('CLIENT'))
      dto.clientId = req.clientId;
    return this.productService.create(dto, req?.user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiSuccessMessage('Listado de productos obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto, @Req() req?: RequestWithUser) {
    return this.productService.findAll(query, req?.clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle producto' })
  @ApiSuccessMessage('Producto obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.productService.findOne(id, req?.clientId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiSuccessMessage('Producto actualizado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req?: RequestWithUser,
  ) {
    return this.productService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto' })
  @ApiSuccessMessage('Producto eliminado correctamente')
  @Roles('ADMIN', 'CLIENT', 'STORE')
  remove(@Param('id') id: string, @Req() req?: RequestWithUser) {
    return this.productService.remove(id, req?.user);
  }
}
