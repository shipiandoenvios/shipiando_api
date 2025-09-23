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
import { ProductCategoryService } from './product-category.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { ApiSuccessMessage } from '../../common/decorators/response.decorator';

@ApiTags('product-category')
@Controller('product-category')
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoría de producto' })
  @ApiSuccessMessage('Categoría de producto creada correctamente')
  create(@Body() dto: CreateProductCategoryDto) {
    return this.productCategoryService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías de producto' })
  @ApiSuccessMessage('Listado de categorías de producto obtenido')
  findAll(@Query() query: PaginationQueryDto) {
    return this.productCategoryService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle categoría de producto' })
  @ApiSuccessMessage('Categoría de producto obtenida')
  findOne(@Param('id') id: string) {
    return this.productCategoryService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar categoría de producto' })
  @ApiSuccessMessage('Categoría de producto actualizada correctamente')
  update(@Param('id') id: string, @Body() dto: UpdateProductCategoryDto) {
    return this.productCategoryService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría de producto' })
  @ApiSuccessMessage('Categoría de producto eliminada correctamente')
  remove(@Param('id') id: string) {
    return this.productCategoryService.remove(id);
  }
}
