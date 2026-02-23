import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // We need to set up minimal environment variables for TypeORM and Bull
    // so the app can compile in the test environment
    process.env.DATABASE_URL = 'sqlite::memory:';
    process.env.NODE_ENV = 'test';

    // In a real e2e test we would mock the database and redis connections,
    // or use testcontainers, but for this quick check we'll just see if it boots and can serve health checks.

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status');
        expect(res.body).toHaveProperty('timestamp');
      });
  });
});
