import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TasksService', () => {
    let tasksService: TasksService;

    const mockPrismaService = {
        task: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        column: {
            findUnique: vi.fn(),
        },
        project: {
            findUnique: vi.fn(),
        },
        projectMember: {
            findFirst: vi.fn(),
        },
        $transaction: vi.fn((callback) => callback(mockPrismaService)),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TasksService,
                { provide: PrismaService, useValue: mockPrismaService },
            ],
        }).compile();

        tasksService = module.get<TasksService>(TasksService);
        vi.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return all tasks for a project', async () => {
            const mockTasks = [
                { id: '1', title: 'Task 1', columnId: 'col-1' },
                { id: '2', title: 'Task 2', columnId: 'col-1' },
            ];

            mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

            const result = await tasksService.findAll('project-1');

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

            const result = await tasksService.findAll('project-1', { columnId: 'col-1' });

            expect(result).toEqual(mockTasks);
        });
    });

    describe('findOne', () => {
        it('should return a task by id', async () => {
            const mockTask = {
                id: '1',
                title: 'Task 1',
                description: 'Description',
                columnId: 'col-1',
                column: { projectId: 'project-1' },
            };

            mockPrismaService.task.findUnique.mockResolvedValue(mockTask);

            const result = await tasksService.findOne('1');

            expect(result).toEqual(mockTask);
            expect(mockPrismaService.task.findUnique).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: '1' },
                }),
            );
        });

        it('should throw NotFoundException if task not found', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(tasksService.findOne('non-existent')).rejects.toThrow(NotFoundException);
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

            const result = await tasksService.update('1', { title: 'Updated Title' });

            expect(result.title).toBe('Updated Title');
        });

        it('should throw NotFoundException when updating non-existent task', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(
                tasksService.update('non-existent', { title: 'New Title' }),
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

            const result = await tasksService.remove('1');

            expect(result).toEqual(mockTask);
            expect(mockPrismaService.task.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            });
        });

        it('should throw NotFoundException when deleting non-existent task', async () => {
            mockPrismaService.task.findUnique.mockResolvedValue(null);

            await expect(tasksService.remove('non-existent')).rejects.toThrow(NotFoundException);
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
            });

            const result = await tasksService.moveTask('1', {
                targetColumnId: 'col-2',
                position: 1,
            });

            expect(result.columnId).toBe('col-2');
        });
    });

    describe('search', () => {
        it('should search tasks by title', async () => {
            const mockTasks = [
                { id: '1', title: 'Fix bug in login' },
                { id: '2', title: 'Bug report handling' },
            ];

            mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

            const result = await tasksService.search('project-1', { query: 'bug' });

            expect(result.length).toBe(2);
            expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({
                                title: expect.objectContaining({ contains: 'bug' }),
                            }),
                        ]),
                    }),
                }),
            );
        });
    });
});
