import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../gateway/events.gateway';
import { MemberRole, TaskPriority, Prisma } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, ReorderTasksDto, SearchTasksDto } from './dto';

import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivityLogService } from '../admin/activity-log.service';

@Injectable()
export class TasksService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
        private mailService: MailService,
        private notificationsService: NotificationsService,
        private activityLogService: ActivityLogService,
    ) { }

    // ==========================================
    // MY TASKS
    // ==========================================

    /**
     * Lấy tất cả tasks được assign cho user hiện tại
     */
    async getMyTasks(userId: string) {
        return this.prisma.task.findMany({
            where: {
                assignees: { some: { id: userId } },
                deletedAt: null,
            },
            include: {
                assignees: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
                creator: {
                    select: { id: true, fullName: true },
                },
                column: {
                    select: {
                        id: true,
                        name: true,
                        color: true,
                        project: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
            orderBy: [
                { dueDate: { sort: 'asc', nulls: 'last' } },
                { priority: 'desc' },
            ],
        });
    }

    // ==========================================
    // SEARCH & FILTER (UC30, UC31)
    // ==========================================

    /**
     * Tìm kiếm và lọc tasks trong project (UC30, UC31)
     */
    async searchTasks(projectId: string, userId: string, filters: SearchTasksDto) {
        // Check membership
        await this.checkProjectPermission(projectId, userId, [
            MemberRole.MEMBER,
            MemberRole.ADMIN,
            MemberRole.OWNER,
        ]);

        const where: Prisma.TaskWhereInput = {
            deletedAt: null,
            column: {
                projectId,
            },
        };

        // Search by title/description
        if (filters.q) {
            where.OR = [
                { title: { contains: filters.q, mode: 'insensitive' } },
                { description: { contains: filters.q, mode: 'insensitive' } },
            ];
        }

        // Filter by priority
        if (filters.priority) {
            where.priority = filters.priority;
        }

        // Filter by assignee
        if (filters.assigneeId) {
            where.assignees = { some: { id: filters.assigneeId } };
        }

        // Filter by column
        if (filters.columnId) {
            where.columnId = filters.columnId;
        }

        // Filter by due date range
        if (filters.dueBefore || filters.dueAfter) {
            where.dueDate = {};
            if (filters.dueBefore) {
                where.dueDate.lte = new Date(filters.dueBefore);
            }
            if (filters.dueAfter) {
                where.dueDate.gte = new Date(filters.dueAfter);
            }
        }

        return this.prisma.task.findMany({
            where,
            include: {
                assignees: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
                creator: {
                    select: { id: true, fullName: true },
                },
                column: {
                    select: { id: true, name: true, color: true },
                },
            },
            orderBy: [{ column: { position: 'asc' } }, { position: 'asc' }],
        });
    }

    // ==========================================
    // TASK CRUD
    // ==========================================

    /**
     * Tạo task mới
     */
    async create(userId: string, dto: CreateTaskDto) {
        // Lấy column và project
        const column = await this.prisma.column.findUnique({
            where: { id: dto.columnId },
            include: { project: true },
        });

        if (!column) {
            throw new NotFoundException('Column không tồn tại');
        }

        // Kiểm tra quyền
        await this.checkProjectPermission(column.projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        // Kiểm tra assignees có phải member không
        if (dto.assigneeIds && dto.assigneeIds.length > 0) {
            const count = await this.prisma.projectMember.count({
                where: {
                    projectId: column.projectId,
                    userId: { in: dto.assigneeIds },
                },
            });

            if (count !== dto.assigneeIds.length) {
                throw new ForbiddenException('Một hoặc nhiều assignee không phải thành viên của project');
            }
        }

        // Lấy position lớn nhất trong column
        const lastTask = await this.prisma.task.findFirst({
            where: { columnId: dto.columnId, deletedAt: null },
            orderBy: { position: 'desc' },
        });

        const position = lastTask ? lastTask.position + 1 : 0;

        // Increment project task counter and get the new task number
        const updatedProject = await this.prisma.project.update({
            where: { id: column.projectId },
            data: { taskCounter: { increment: 1 } },
            select: { taskCounter: true },
        });

        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                priority: dto.priority || TaskPriority.MEDIUM,
                columnId: dto.columnId,
                creatorId: userId,
                taskNumber: updatedProject.taskCounter,
                assignees: {
                    connect: dto.assigneeIds?.map(id => ({ id })) || [],
                },
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                position,
            },
            include: {
                assignees: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
                creator: {
                    select: { id: true, fullName: true },
                },
                column: {
                    select: { id: true, name: true, color: true },
                },
            },
        });

        // Emit realtime event
        this.eventsGateway.emitTaskCreated(
            column.projectId,
            task as unknown as Record<string, unknown>,
            { id: userId, fullName: task.creator.fullName || 'Unknown' }
        );

        // Notify assignees (except the creator)
        if (dto.assigneeIds && dto.assigneeIds.length > 0) {
            const assigneesToNotify = dto.assigneeIds.filter(id => id !== userId);
            for (const assigneeId of assigneesToNotify) {
                this.notificationsService.notifyTaskAssigned(
                    assigneeId,
                    task.title,
                    task.creator.fullName || 'Ai đó',
                    task.id,
                    column.project.slug,
                ).catch(err => console.error('Failed to create assignment notification:', err));
            }
        }

        // Log task creation
        await this.activityLogService.log({
            projectId: column.projectId,
            userId,
            action: 'TASK_CREATED',
            targetType: 'Task',
            targetId: task.id,
            details: { title: task.title, columnName: column.name },
        });

        return task;
    }

    /**
     * Lấy task theo ID
     */
    async findById(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: {
                assignees: {
                    select: { id: true, email: true, fullName: true, avatarUrl: true },
                },
                creator: {
                    select: { id: true, fullName: true },
                },
                column: {
                    include: {
                        project: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Kiểm tra quyền truy cập
        await this.checkProjectPermission(task.column.projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        return task;
    }

    /**
     * Cập nhật task
     */
    async update(taskId: string, userId: string, dto: UpdateTaskDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: {
                column: {
                    include: { project: true }
                },
                assignees: true
            },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Kiểm tra quyền (owner/admin có thể sửa tất cả, member chỉ sửa task của mình)
        const membership = await this.checkProjectPermission(
            task.column.projectId,
            userId,
            [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER],
        );

        if (
            membership.role === MemberRole.MEMBER &&
            task.creatorId !== userId &&
            task.creatorId !== userId &&
            !task.assignees.some(a => a.id === userId)
        ) {
            throw new ForbiddenException('Bạn chỉ có thể sửa task của mình');
        }

        // Kiểm tra assignees mới (nếu có)
        if (dto.assigneeIds && dto.assigneeIds.length > 0) {
            const count = await this.prisma.projectMember.count({
                where: {
                    projectId: task.column.projectId,
                    userId: { in: dto.assigneeIds },
                },
            });

            if (count !== dto.assigneeIds.length) {
                throw new ForbiddenException('Một hoặc nhiều assignee không phải thành viên của project');
            }
        }

        const { assigneeIds, ...updateData } = dto;
        const updater = await this.prisma.user.findUnique({ where: { id: userId } });

        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...updateData,
                dueDate: dto.dueDate === null ? null : dto.dueDate ? new Date(dto.dueDate) : undefined,
                assignees: assigneeIds ? { set: assigneeIds.map(id => ({ id })) } : undefined,
            },
            include: {
                assignees: {
                    select: { id: true, fullName: true, avatarUrl: true },
                },
                creator: {
                    select: { id: true, fullName: true },
                },
                column: {
                    select: { id: true, name: true, color: true },
                },
            },
        });
        // Emit realtime event
        this.eventsGateway.emitTaskUpdated(
            task.column.projectId,
            updatedTask as unknown as Record<string, unknown>,
            { id: userId, fullName: updater?.fullName || 'Unknown' }
        );

        // Send update email to assignees if enabled
        const assigneesToNotify = await this.prisma.user.findMany({
            where: {
                AND: [
                    { id: { in: updatedTask.assignees.map(a => a.id) } },
                    { id: { not: userId } }, // Don't notify updater
                    { taskUpdateNotifications: true },
                ]
            }
        });

        // Detect new assignees to send "Task Assigned" notification
        const oldAssigneeIds = new Set(task.assignees.map(a => a.id));
        const newAssigneeIds = dto.assigneeIds?.filter(id => !oldAssigneeIds.has(id)) || [];

        for (const userToNotify of assigneesToNotify) {
            // Send email
            this.mailService.sendTaskUpdateEmail(
                userToNotify.email,
                updatedTask.title,
                updater?.fullName || 'Ai đó'
            ).catch(err => console.error('Failed to send task update email:', err));

            // Create in-app notification
            if (newAssigneeIds.includes(userToNotify.id)) {
                // Sent "Task Assigned" if they were newly added
                this.notificationsService.notifyTaskAssigned(
                    userToNotify.id,
                    updatedTask.title,
                    updater?.fullName || 'Ai đó',
                    taskId,
                    task.column.project.slug,
                ).catch(err => console.error('Failed to create assignment notification:', err));
            } else {
                // Otherwise send "Task Updated"
                this.notificationsService.notifyTaskUpdate(
                    userToNotify.id,
                    updatedTask.title,
                    updater?.fullName || 'Ai đó',
                    taskId,
                    task.column.project.slug,
                ).catch(err => console.error('Failed to create update notification:', err));
            }
        }

        return updatedTask;
    }

    /**
     * Xóa task (soft delete)
     */
    async delete(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: { column: true },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        const membership = await this.checkProjectPermission(
            task.column.projectId,
            userId,
            [MemberRole.OWNER, MemberRole.ADMIN, MemberRole.MEMBER],
        );

        // Member chỉ xóa được task của mình
        if (membership.role === MemberRole.MEMBER && task.creatorId !== userId) {
            throw new ForbiddenException('Bạn chỉ có thể xóa task của mình');
        }

        const deletedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: { deletedAt: new Date() },
        });

        // Emit realtime event
        this.eventsGateway.emitTaskDeleted(
            task.column.projectId,
            taskId,
            { id: userId, fullName: 'User' }
        );

        // Log task deletion
        await this.activityLogService.log({
            projectId: task.column.projectId,
            userId,
            action: 'TASK_DELETED',
            targetType: 'Task',
            targetId: taskId,
            details: { title: task.title },
        });

        return deletedTask;
    }

    // ==========================================
    // TASK MOVEMENT (Drag & Drop)
    // ==========================================

    /**
     * Di chuyển task sang column khác hoặc đổi vị trí
     */
    async moveTask(taskId: string, userId: string, dto: MoveTaskDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: { column: true },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Lấy target column
        const targetColumn = await this.prisma.column.findUnique({
            where: { id: dto.targetColumnId },
        });

        if (!targetColumn) {
            throw new NotFoundException('Column đích không tồn tại');
        }

        // Kiểm tra cùng project
        if (task.column.projectId !== targetColumn.projectId) {
            throw new ForbiddenException('Không thể di chuyển task sang project khác');
        }

        // Kiểm tra quyền
        await this.checkProjectPermission(task.column.projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        const oldColumnId = task.columnId;
        const oldPosition = task.position;
        const newPosition = dto.newPosition;

        // Transaction để đảm bảo consistency
        return this.prisma.$transaction(async (tx) => {
            // Di chuyển trong cùng column
            if (oldColumnId === dto.targetColumnId) {
                if (oldPosition < newPosition) {
                    // Di chuyển xuống
                    await tx.task.updateMany({
                        where: {
                            columnId: oldColumnId,
                            position: { gt: oldPosition, lte: newPosition },
                            deletedAt: null,
                        },
                        data: { position: { decrement: 1 } },
                    });
                } else if (oldPosition > newPosition) {
                    // Di chuyển lên
                    await tx.task.updateMany({
                        where: {
                            columnId: oldColumnId,
                            position: { gte: newPosition, lt: oldPosition },
                            deletedAt: null,
                        },
                        data: { position: { increment: 1 } },
                    });
                }
            } else {
                // Di chuyển sang column khác
                // Giảm position các task phía sau ở column cũ
                await tx.task.updateMany({
                    where: {
                        columnId: oldColumnId,
                        position: { gt: oldPosition },
                        deletedAt: null,
                    },
                    data: { position: { decrement: 1 } },
                });

                // Tăng position các task từ vị trí mới ở column đích
                await tx.task.updateMany({
                    where: {
                        columnId: dto.targetColumnId,
                        position: { gte: newPosition },
                        deletedAt: null,
                    },
                    data: { position: { increment: 1 } },
                });
            }

            // Cập nhật task
            const movedTask = await tx.task.update({
                where: { id: taskId },
                data: {
                    columnId: dto.targetColumnId,
                    position: newPosition,
                },
                include: {
                    assignees: {
                        select: { id: true, fullName: true, avatarUrl: true },
                    },
                    creator: {
                        select: { id: true, fullName: true },
                    },
                    column: {
                        select: { id: true, name: true, color: true },
                    },
                },
            });

            // Emit realtime event for task moved
            this.eventsGateway.emitTaskMoved(
                task.column.projectId,
                taskId,
                oldColumnId,
                dto.targetColumnId,
                newPosition,
                { id: userId, fullName: movedTask.creator.fullName || 'Unknown' }
            );

            // Log task movement
            await this.activityLogService.log({
                projectId: task.column.projectId,
                userId,
                action: 'TASK_MOVED',
                targetType: 'Task',
                targetId: taskId,
                details: {
                    title: movedTask.title,
                    fromColumn: oldColumnId,
                    toColumn: dto.targetColumnId,
                },
            });

            return movedTask;
        });
    }
    /**
     * Reorder tasks trong một column
     */
    async reorderTasks(columnId: string, userId: string, dto: ReorderTasksDto) {
        const column = await this.prisma.column.findUnique({
            where: { id: columnId },
        });

        if (!column) {
            throw new NotFoundException('Column không tồn tại');
        }

        await this.checkProjectPermission(column.projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        // Cập nhật position cho từng task
        const updates = dto.taskIds.map((taskId, index) =>
            this.prisma.task.update({
                where: { id: taskId },
                data: { position: index },
            }),
        );

        await this.prisma.$transaction(updates);

        return { success: true };
    }

    /**
     * Thêm label vào task
     */
    async addLabel(taskId: string, userId: string, labelId: string) {
        // Verify task exists
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: { column: true },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Check permission
        await this.checkProjectPermission(task.column.projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        // Verify label belongs to project
        const label = await this.prisma.label.findUnique({
            where: { id: labelId },
        });

        if (!label || label.projectId !== task.column.projectId) {
            throw new NotFoundException('Label không tồn tại trong dự án này');
        }

        return this.prisma.taskLabel.upsert({
            where: {
                taskId_labelId: { taskId, labelId },
            },
            create: {
                taskId,
                labelId,
            },
            update: {}, // Do nothing if already exists
        });
    }

    /**
     * Xóa label khỏi task
     */
    async removeLabel(taskId: string, userId: string, labelId: string) {
        // Verify task exists
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: { column: true },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        // Check permission
        await this.checkProjectPermission(task.column.projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        return this.prisma.taskLabel.delete({
            where: {
                taskId_labelId: { taskId, labelId },
            },
        }).catch(() => {
            // Ignore if already deleted
        });
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private async checkProjectPermission(
        projectId: string,
        userId: string,
        allowedRoles: MemberRole[],
    ) {
        const member = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId },
            },
        });

        if (!member) {
            throw new ForbiddenException('Bạn không phải thành viên của project này');
        }

        if (!allowedRoles.includes(member.role)) {
            throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
        }

        return member;
    }
}
