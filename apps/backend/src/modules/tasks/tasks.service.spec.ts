import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../admin/activity-log.service';
import { NotFoundException } from '@nestjs/common';

/**
 * TasksService Unit Tests
 * Testing core task operations with mocked dependencies
 */
describe('TasksService', () => {
    let tasksService: TasksService;

    const mockPrismaService = {
        user: { findUnique: vi.fn() },
        task: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
            updateMany: vi.fn(),
        },
        column: { findUnique: vi.fn() },
        project: { findUnique: vi.fn(), update: vi.fn() },
        projectMember: { findFirst: vi.fn(), findUnique: vi.fn() },
        $transaction: vi.fn((callback) => callback(mockPrismaService)),
    };

    const mockEventsGateway = {
        server: { to: vi.fn().mockReturnThis(), emit: vi.fn() },
        emitTaskCreated: vi.fn(),
        emitTaskUpdated: vi.fn(),
        emitTaskDeleted: vi.fn(),
        emitTaskMoved: vi.fn(),
    };

    const mockMailService = { sendTaskAssignmentEmail: vi.fn() };
    const mockNotificationsService = { create: vi.fn() };
    const mockActivityLogService = { log: vi.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: EventsGateway, useValue: mockEventsGateway },
                { provide: MailService, useValue: mockMailService },
                { provide: NotificationsService, useValue: mockNotificationsService },
                { provide: ActivityLogService, useValue: mockActivityLogService },
            ],
        }).compile();

        tasksService = module.get<TasksService>(TasksService);
        vi.clearAllMocks();

        // Default mocks
        mockPrismaService.projectMember.findUnique.mockResolvedValue({ role: 'OWNER' });
        mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', fullName: 'Test User' });
    });

    describe('searchTasks', () => {
        it('should return all tasks for a project', async () => {
            const mockTasks = [
                { id: '1', title: 'Task 1' },
                { id: '2', title: 'Task 2' },
            ];
            mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

            const result = await tasksService.searchTasks('project-1', 'user-1', {});

            expect(result).toEqual(mockTasks);
            expect(mockPrismaService.task.findMany).toHaveBeenCalled();
        });

        it('should filter tasks by columnId', async () => {
            const mockTasks = [{ id: '1', title: 'Task 1', columnId: 'col-1' }];
            mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

            const result = await tasksService.searchTasks('project-1', 'user-1', { columnId: 'col-1' });

            expect(result).toHaveLength(1);
        });
    });

    describe('findById', () => {
        it('should return a task by id', async () => {
            const mockTask = {
                id: '1',
                title: 'Task 1',
                column: { projectId: 'project-1' },
            };
            mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

            const result = await tasksService.findById('1', 'user-1');

            expect(result.id).toBe('1');
        });

        it('should throw NotFoundException if task not found', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(tasksService.findById('non-existent', 'user-1'))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should throw NotFoundException if column not found', async () => {
            mockPrismaService.column.findUnique.mockResolvedValue(null);

            await expect(
                tasksService.create('user-1', { title: 'Task', columnId: 'non-existent' })
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should throw NotFoundException for non-existent task', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(
                tasksService.update('non-existent', 'user-1', { title: 'New Title' })
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should throw NotFoundException for non-existent task', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(tasksService.delete('non-existent', 'user-1'))
                .rejects.toThrow(NotFoundException);
        });
    });
});
