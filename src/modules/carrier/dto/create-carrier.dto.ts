import { IsOptional, IsString } from 'class-validator';

export class CreateCarrierDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  name: string;
}
