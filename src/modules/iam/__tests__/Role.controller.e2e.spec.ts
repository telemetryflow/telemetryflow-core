import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';

describe('RoleController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let createdRoleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/v2/auth/login')
      .send({ email: 'administrator.telemetryflow@telemetryflow.id', password: 'Admin@123456' });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v2/iam/roles', () => {
    it('should create a new role', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v2/iam/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'TestRole',
          description: 'Test role description',
          permissionIds: [],
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('TestRole');
      createdRoleId = response.body.id;
    });
  });

  describe('GET /api/v2/iam/roles', () => {
    it('should list all roles', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v2/iam/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v2/iam/roles/:id', () => {
    it('should get role by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v2/iam/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdRoleId);
      expect(response.body.name).toBe('TestRole');
    });
  });

  describe('PATCH /api/v2/iam/roles/:id', () => {
    it('should update role', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v2/iam/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'UpdatedTestRole' })
        .expect(200);

      expect(response.body.name).toBe('UpdatedTestRole');
    });
  });

  describe('DELETE /api/v2/iam/roles/:id', () => {
    it('should delete role', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v2/iam/roles/${createdRoleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);
    });
  });
});
