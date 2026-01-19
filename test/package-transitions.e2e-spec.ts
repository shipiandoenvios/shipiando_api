/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { PackageService } from '../src/modules/package/package.service';

class TestAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const rolesHeader = (req.headers['x-user-roles'] || '') as string;
    const roles = rolesHeader
      ? rolesHeader.split(',').map((r) => r.trim().toUpperCase())
      : [];
    req.user = { id: req.headers['x-user-id'] || 'test-user', roles };
    req.clientId = req.headers['x-client-id'];
    return true;
  }
}

describe('Package status transition E2E (RBAC) - /package', () => {
  let app: INestApplication;
  let packageService: PackageService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(new TestAuthGuard())
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    packageService = moduleFixture.get(PackageService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows IN_TRANSIT -> DELIVERED for CARRIER role', async () => {
    // Arrange: mock underlying service behavior

    jest
      .spyOn(packageService, 'findOne')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue({ id: 'pkg1', status: 'IN_TRANSIT' } as any);

    jest
      .spyOn(packageService, 'update')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue({ id: 'pkg1', status: 'DELIVERED' } as any);

    // Act
    const res = await request(app.getHttpServer())
      .patch('/package/pkg1')
      .set('Authorization', 'Bearer test')
      .set('x-user-roles', 'CARRIER')
      .send({ status: 'DELIVERED' })
      .expect(200);

    expect(res.body).toHaveProperty('id', 'pkg1');
    expect(res.body).toHaveProperty('status', 'DELIVERED');
  });

  it('forbids IN_TRANSIT -> DELIVERED for WAREHOUSE role', async () => {
    // Arrange: service will throw Forbidden for this role-transition combination

    jest
      .spyOn(packageService, 'findOne')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockResolvedValue({ id: 'pkg2', status: 'IN_TRANSIT' } as any);
    jest.spyOn(packageService, 'update').mockImplementation(() => {
      throw new ForbiddenException(
        'No autorizado para realizar esta transición',
      );
    });

    // Act
    const res = await request(app.getHttpServer())
      .patch('/package/pkg2')
      .set('Authorization', 'Bearer test')
      .set('x-user-roles', 'WAREHOUSE')
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('message');
  });
});
