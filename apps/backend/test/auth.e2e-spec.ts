import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth API (e2e)', () => {
    let app: INestApplication;
    const testUser = {
        email: `e2e-test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        fullName: 'E2E Test User',
    };
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        app.setGlobalPrefix('api/v1');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testUser.email);
        });

        it('should reject duplicate email', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(testUser)
                .expect(409);
        });

        it('should reject weak password', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'weak@example.com',
                    password: '123',
                    fullName: 'Weak Password User',
                })
                .expect(400);
        });

        it('should reject invalid email format', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'ValidPassword123!',
                    fullName: 'Invalid Email User',
                })
                .expect(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
            accessToken = response.body.accessToken;
            refreshToken = response.body.refreshToken;
        });

        it('should reject invalid password', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123!',
                })
                .expect(401);
        });

        it('should reject non-existent user', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'SomePassword123!',
                })
                .expect(401);
        });
    });

    describe('GET /api/v1/auth/profile', () => {
        it('should return user profile with valid token', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.email).toBe(testUser.email);
        });

        it('should reject request without token', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .expect(401);
        });

        it('should reject request with invalid token', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh tokens with valid refresh token', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('refreshToken');
        });

        it('should reject invalid refresh token', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-refresh-token' })
                .expect(401);
        });
    });
});
