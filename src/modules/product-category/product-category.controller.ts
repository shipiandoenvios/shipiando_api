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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('product-category')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('product-category')
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoría de producto' })
  @ApiSuccessMessage('Categoría de producto creada correctamente')
  @Roles('ADMIN', 'STORE')
  create(@Body() dto: CreateProductCategoryDto) {
    return this.productCategoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías de producto' })
  @ApiSuccessMessage('Listado de categorías de producto obtenido')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findAll(@Query() query: PaginationQueryDto) {
    return this.productCategoryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle categoría de producto' })
  @ApiSuccessMessage('Categoría de producto obtenida')
  @Roles('ADMIN', 'CLIENT', 'USER', 'WAREHOUSE', 'CARRIER', 'STORE')
  findOne(@Param('id') id: string) {
    return this.productCategoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar categoría de producto' })
  @ApiSuccessMessage('Categoría de producto actualizada correctamente')
  @Roles('ADMIN', 'STORE')
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.productCategoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría de producto' })
  @ApiSuccessMessage('Categoría de producto eliminada correctamente')
  @Roles('ADMIN', 'STORE')
  remove(@Param('id') id: string) {
    return this.productCategoryService.remove(id);
  }
}
