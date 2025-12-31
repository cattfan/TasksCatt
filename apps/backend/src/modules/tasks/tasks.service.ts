import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole, TaskPriority, Prisma } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, ReorderTasksDto, SearchTasksDto } from './dto';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // SEARCH & FILTER (UC30, UC31)
    // ==========================================

    /**
     * Tìm kiếm và lọc tasks trong project (UC30, UC31)
     */
    async searchTasks(projectId: string, userId: string, filters: SearchTasksDto) {
        // Check membership
        await this.checkProjectPermission(projectId, userId, [
            MemberRole.VIEWER,
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
            where.assigneeId = filters.assigneeId;
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
                assignee: {
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

        // Kiểm tra assignee có phải member không
        if (dto.assigneeId) {
            const isMember = await this.prisma.projectMember.findFirst({
                where: { projectId: column.projectId, userId: dto.assigneeId },
            });

            if (!isMember) {
                throw new ForbiddenException('Assignee không phải thành viên của project');
            }
        }

        // Lấy position lớn nhất trong column
        const lastTask = await this.prisma.task.findFirst({
            where: { columnId: dto.columnId, deletedAt: null },
            orderBy: { position: 'desc' },
        });

        const position = lastTask ? lastTask.position + 1 : 0;

        return this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                priority: dto.priority || TaskPriority.MEDIUM,
                columnId: dto.columnId,
                creatorId: userId,
                assigneeId: dto.assigneeId,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
                position,
            },
            include: {
                assignee: {
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
    }

    /**
     * Lấy task theo ID
     */
    async findById(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: {
                assignee: {
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
            MemberRole.VIEWER,
        ]);

        return task;
    }

    /**
     * Cập nhật task
     */
    async update(taskId: string, userId: string, dto: UpdateTaskDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId, deletedAt: null },
            include: { column: true },
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
            task.assigneeId !== userId
        ) {
            throw new ForbiddenException('Bạn chỉ có thể sửa task của mình');
        }

        // Kiểm tra assignee mới (nếu có)
        if (dto.assigneeId) {
            const isMember = await this.prisma.projectMember.findFirst({
                where: { projectId: task.column.projectId, userId: dto.assigneeId },
            });

            if (!isMember) {
                throw new ForbiddenException('Assignee không phải thành viên của project');
            }
        }

        return this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...dto,
                dueDate: dto.dueDate === null ? null : dto.dueDate ? new Date(dto.dueDate) : undefined,
                assigneeId: dto.assigneeId === null ? null : dto.assigneeId,
            },
            include: {
                assignee: {
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

        return this.prisma.task.update({
            where: { id: taskId },
            data: { deletedAt: new Date() },
        });
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
            return tx.task.update({
                where: { id: taskId },
                data: {
                    columnId: dto.targetColumnId,
                    position: newPosition,
                },
                include: {
                    assignee: {
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
