import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../admin/activity-log.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
    let tasksService: TasksService;

    const mockPrismaService = {
        user: {
            findUnique: vi.fn(),
        },
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
        column: {
            findUnique: vi.fn(),
        },
        project: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        projectMember: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(mockPrismaService)),
    };

    const mockEventsGateway = {
        server: { to: vi.fn().mockReturnThis(), emit: vi.fn() },
        emitTaskCreated: vi.fn(),
        emitTaskUpdated: vi.fn(),
        emitTaskDeleted: vi.fn(),
        emitTaskMoved: vi.fn(),
    };

    const mockMailService = {
        sendTaskAssignmentEmail: vi.fn(),
    };

    const mockNotificationsService = {
        create: vi.fn(),
    };

    const mockActivityLogService = {
        log: vi.fn(),
    };

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

        // Default permission: User is owner
        mockPrismaService.projectMember.findUnique.mockResolvedValue({ role: 'OWNER' });
        // Default user for logs
        mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-1', fullName: 'Test User' });
    });

    describe('searchTasks', () => {
        it('should return all tasks for a project when no filters provided', async () => {
            const mockTasks = [
                { id: '1', title: 'Task 1', columnId: 'col-1' },
                { id: '2', title: 'Task 2', columnId: 'col-1' },
            ];

            mockPrismaService.task.findMany.mockResolvedValue(mockTasks);
            // Mock permissions
            mockPrismaService.projectMember.findUnique.mockResolvedValue({ role: 'OWNER' });

            const result = await tasksService.searchTasks('project-1', 'user-1', {});

            expect(result).toEqual(mockTasks);
            expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        column: { projectId: 'project-1' },
                    }),
                }),
            );
        });

        it('should filter tasks by columnId', async () => {
            const mockTasks = [{ id: '1', title: 'Task 1', columnId: 'col-1' }];

            mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

            const result = await tasksService.searchTasks('project-1', 'user-1', { columnId: 'col-1' });

            expect(result).toEqual(mockTasks);
        });
    });

    describe('findById', () => {
        it('should return a task by id', async () => {
            const mockTask = {
                id: '1',
                title: 'Task 1',
                description: 'Description',
                columnId: 'col-1',
                column: { projectId: 'project-1' },
            };

            mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

            const result = await tasksService.findById('1', 'user-1');

            expect(result).toEqual(mockTask);
            expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ id: '1' }),
                }),
            );
        });

        it('should throw NotFoundException if task not found', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(tasksService.findById('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a new task', async () => {
            const createDto = {
                title: 'New Task',
                description: 'Task description',
                columnId: 'col-1',
            };

            const mockColumn = {
                id: 'col-1',
                projectId: 'project-1',
                project: { prefix: 'TASK' },
            };

            const mockCreatedTask = {
                id: '1',
                ...createDto,
                taskKey: 'TASK-1',
                position: 0,
            };

            mockPrismaService.column.findUnique.mockResolvedValue(mockColumn);
            mockPrismaService.task.count.mockResolvedValue(0);
            mockPrismaService.task.create.mockResolvedValue(mockCreatedTask);
            // Mock permissions check
            mockPrismaService.projectMember.findFirst.mockResolvedValue({ role: 'OWNER' });

            const result = await tasksService.create('user-1', createDto);

            expect(result.title).toBe('New Task');
            expect(mockPrismaService.task.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if column not found', async () => {
            mockPrismaService.column.findUnique.mockResolvedValue(null);

            await expect(
                tasksService.create('user-1', {
                    title: 'Task',
                    columnId: 'non-existent',
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('should update a task', async () => {
            const mockTask = {
                id: '1',
                title: 'Original Title',
                column: { projectId: 'project-1' },
            };

            const updatedTask = {
                ...mockTask,
                title: 'Updated Title',
            };

            mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
            mockPrismaService.task.update.mockResolvedValue(updatedTask);

            const result = await tasksService.update('1', 'user-1', { title: 'Updated Title' });

            expect(result.title).toBe('Updated Title');
        });

        it('should throw NotFoundException when updating non-existent task', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(
                tasksService.update('non-existent', 'user-1', { title: 'New Title' }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete', () => {
        it('should delete a task', async () => {
            const mockTask = {
                id: '1',
                title: 'Task to delete',
                column: { projectId: 'project-1' },
            };

            mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
            mockPrismaService.task.delete.mockResolvedValue(mockTask);

            const result = await tasksService.delete('1', 'user-1');

            expect(result).toEqual(mockTask);
        });

        it('should throw NotFoundException when deleting non-existent task', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(tasksService.delete('non-existent', 'user-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('moveTask', () => {
        it('should move task to a new column', async () => {
            const mockTask = {
                id: '1',
                title: 'Task',
                columnId: 'col-1',
                position: 0,
                column: { projectId: 'project-1' },
            };

            const mockTargetColumn = {
                id: 'col-2',
                projectId: 'project-1',
            };

            mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
            mockPrismaService.column.findUnique.mockResolvedValue(mockTargetColumn);
            mockPrismaService.task.update.mockResolvedValue({
                ...mockTask,
                columnId: 'col-2',
                position: 1,
                creator: { id: 'user-1', fullName: 'Creator' }
            });

            const result = await tasksService.moveTask('1', 'user-1', {
                targetColumnId: 'col-2',
                position: 1,
            });

            expect(result.columnId).toBe('col-2');
        });
    });
});
