import { Test, TestingModule } from '@nestjs/testing';
import { ClientUserController } from './client-user.controller';

describe('ClientUserController', () => {
  let controller: ClientUserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientUserController],
    }).compile();

    controller = module.get<ClientUserController>(ClientUserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
