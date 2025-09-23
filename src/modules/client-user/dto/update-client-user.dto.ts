import { PartialType } from '@nestjs/mapped-types';
import { CreateClientUserDto } from './create-client-user.dto';

export class UpdateClientUserDto extends PartialType(CreateClientUserDto) {}
