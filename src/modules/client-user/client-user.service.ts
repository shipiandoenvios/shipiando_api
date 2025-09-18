import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClientUserDto } from './dto/create-client-user.dto';
import { UpdateClientUserDto } from './dto/update-client-user.dto';

@Injectable()
export class ClientUserService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateClientUserDto) {
    return this.prisma.clientUser.create({ data });
  }

  findByClient(clientId: string) {
    return this.prisma.clientUser.findMany({ where: { clientId } });
  }

  findByUser(userId: string) {
    return this.prisma.clientUser.findMany({ where: { userId } });
  }

  async update(id: string, data: UpdateClientUserDto) {
    await this.prisma.clientUser.findUnique({ where: { id } }) || (() => { throw new NotFoundException(); })();
    return this.prisma.clientUser.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.clientUser.findUnique({ where: { id } }) || (() => { throw new NotFoundException(); })();
    return this.prisma.clientUser.delete({ where: { id } });
  }
}
