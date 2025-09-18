import { Module } from '@nestjs/common';
import { ClientUserController } from './client-user.controller';
import { ClientUserService } from './client-user.service';

@Module({
  controllers: [ClientUserController],
  providers: [ClientUserService]
})
export class ClientUserModule {}
