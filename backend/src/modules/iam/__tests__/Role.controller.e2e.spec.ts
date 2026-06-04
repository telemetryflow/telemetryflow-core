import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import net from 'net';
import { AppModule } from '../../../app.module';

async function isPortOpen(host: string, port: number, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timer = setTimeout(() => { socket.destroy(); resolve(false); }, timeoutMs);
    socket.connect(port, host, () => { clearTimeout(timer); socket.destroy(); resolve(true); });
    socket.on('error', () => { clearTimeout(timer); socket.destroy(); resolve(false); });
  });
}

async function isInfrastructureAvailable(): Promise<boolean> {
  const pg = await isPortOpen(process.env.DB_HOST || '127.0.0.1', Number(process.env.DB_PORT) || 5432);
  const redis = await isPortOpen(process.env.REDIS_HOST || '127.0.0.1', Number(process.env.REDIS_PORT) || 6379);
  return pg && redis;
}

describe('RoleController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdRoleId: string;
  const uniqueSuffix = Date.now();
  let skipAll = false;

  beforeAll(async () => {
    if (!(await isInfrastructureAvailable())) {
      skipAll = true;
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v2');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
        stopAtFirstError: false,
      }),
    );
    await app.init();

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: 'superadmin.telemetryflow@telemetryflow.id', password: 'SuperAdmin@654123' });

    authToken = loginResponse.body.accessToken;
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    if (skipAll) {
      return;
    }
  });

  describe('POST /api/v2/roles', () => {
    it('should create a new role', async () => {
      if (skipAll) return;

      const response = await request(app.getHttpServer())
        .post('/api/v2/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: `TestRole-${uniqueSuffix}`,
          description: 'Test role description',
          permissionIds: [],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(`TestRole-${uniqueSuffix}`);
      createdRoleId = response.body.id;
    });
  });

  describe('GET /api/v2/roles', () => {
    it('should list all roles', async () => {
      if (skipAll) return;

      const response = await request(app.getHttpServer())
        .get('/api/v2/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v2/roles/:id', () => {
    it('should get role by id', async () => {
      if (skipAll) return;

      const response = await request(app.getHttpServer())
        .get(`/api/v2/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdRoleId);
      expect(response.body.name).toBe(`TestRole-${uniqueSuffix}`);
    });
  });

  describe('PATCH /api/v2/roles/:id', () => {
    it('should update role', async () => {
      if (skipAll) return;

      const response = await request(app.getHttpServer())
        .patch(`/api/v2/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: `UpdatedTestRole-${uniqueSuffix}` })
        .expect(200);

      expect(response.body.name).toBe(`UpdatedTestRole-${uniqueSuffix}`);
    });
  });

  describe('DELETE /api/v2/roles/:id', () => {
    it('should delete role', async () => {
      if (skipAll) return;

      await request(app.getHttpServer())
        .delete(`/api/v2/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });
});
