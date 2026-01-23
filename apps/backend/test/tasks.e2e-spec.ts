import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Tasks API (e2e)', () => {
    let app: INestApplication;
    let accessToken: string;
    let projectId: string;
    let columnId: string;
    let taskId: string;

    const testUser = {
        email: `tasks-e2e-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        fullName: 'Tasks E2E User',
    };

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

        // Register and login
        const registerResponse = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send(testUser);
        accessToken = registerResponse.body.accessToken;

        // Create a test project
        const projectResponse = await request(app.getHttpServer())
            .post('/api/v1/projects')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                name: 'E2E Test Project',
                description: 'Project for E2E testing',
            });
        projectId = projectResponse.body.id;
        columnId = projectResponse.body.columns[0].id; // First default column
    });

    afterAll(async () => {
        await app.close();
    });

    describe('POST /api/v1/tasks', () => {
        it('should create a new task', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'E2E Test Task',
                    description: 'This is a test task',
                    columnId,
                    priority: 'MEDIUM',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe('E2E Test Task');
            expect(response.body).toHaveProperty('taskKey');
            taskId = response.body.id;
        });

        it('should reject task without title', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    description: 'Task without title',
                    columnId,
                })
                .expect(400);
        });

        it('should reject task with invalid columnId', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/tasks')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Task with invalid column',
                    columnId: 'non-existent-column-id',
                })
                .expect(404);
        });

        it('should reject unauthenticated request', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/tasks')
                .send({
                    title: 'Unauthorized Task',
                    columnId,
                })
                .expect(401);
        });
    });

    describe('GET /api/v1/tasks', () => {
        it('should get all tasks for a project', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/projects/${projectId}/tasks`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/v1/tasks/:id', () => {
        it('should get a specific task', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.id).toBe(taskId);
            expect(response.body.title).toBe('E2E Test Task');
        });

        it('should return 404 for non-existent task', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/tasks/non-existent-id')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });

    describe('PATCH /api/v1/tasks/:id', () => {
        it('should update a task', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Updated E2E Task',
                    description: 'Updated description',
                    priority: 'HIGH',
                })
                .expect(200);

            expect(response.body.title).toBe('Updated E2E Task');
            expect(response.body.priority).toBe('HIGH');
        });

        it('should partially update a task', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    description: 'Only description updated',
                })
                .expect(200);

            expect(response.body.title).toBe('Updated E2E Task');
            expect(response.body.description).toBe('Only description updated');
        });
    });

    describe('POST /api/v1/tasks/:id/move', () => {
        let secondColumnId: string;

        it('should get second column for move test', async () => {
            const response = await request(app.getHttpServer())
                .get(`/api/v1/projects/${projectId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);

            secondColumnId = response.body.columns[1]?.id;
            expect(secondColumnId).toBeDefined();
        });

        it('should move task to another column', async () => {
            if (!secondColumnId) return;

            const response = await request(app.getHttpServer())
                .post(`/api/v1/tasks/${taskId}/move`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    targetColumnId: secondColumnId,
                    position: 0,
                })
                .expect(200);

            expect(response.body.columnId).toBe(secondColumnId);
        });
    });

    describe('DELETE /api/v1/tasks/:id', () => {
        it('should delete a task', async () => {
            await request(app.getHttpServer())
                .delete(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200);
        });

        it('should return 404 for deleted task', async () => {
            await request(app.getHttpServer())
                .get(`/api/v1/tasks/${taskId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(404);
        });
    });
});
