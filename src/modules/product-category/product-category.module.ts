import { Module } from '@nestjs/common';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryController } from './product-category.controller';

@Module({
  providers: [ProductCategoryService],
  controllers: [ProductCategoryController],
})
export class ProductCategoryModule {}
