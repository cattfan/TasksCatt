import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';
import { vi } from 'vitest';

/**
 * Creates a fully configured NestJS test application
 */
export async function createTestApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();

    // Apply global pipes like in production
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    await app.init();
    return app;
}

/**
 * Gets an auth token for testing authenticated endpoints
 */
export async function getTestAuthToken(app: INestApplication): Promise<string> {
    // Create test user or use existing one
    const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        fullName: 'Test User',
    };

    // Register user
    await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser);

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
            email: testUser.email,
            password: testUser.password,
        });

    return loginResponse.body.accessToken;
}

/**
 * Mock PrismaService for unit tests
 */
export const mockPrismaService = {
    user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    project: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    task: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    column: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        updateMany: vi.fn(),
    },
    $transaction: vi.fn((callback: any) => callback(mockPrismaService)),
};
