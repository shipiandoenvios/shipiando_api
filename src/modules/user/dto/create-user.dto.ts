import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ minLength: 6, description: 'Hash o contraseña (temporal)' })
  @IsString()
  @MinLength(6)
  passwordHash: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleId?: string;
}
