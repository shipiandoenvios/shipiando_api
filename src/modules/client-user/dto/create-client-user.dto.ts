import { IsString } from 'class-validator';

export class CreateClientUserDto {
  @IsString()
  clientId: string;

  @IsString()
  userId: string;

  @IsString()
  role: string;
}
