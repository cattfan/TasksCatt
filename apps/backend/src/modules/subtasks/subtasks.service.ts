import {
    Injectable,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateSubtaskDto, UpdateSubtaskDto } from './dto';

@Injectable()
export class SubtasksService {
    constructor(private prisma: PrismaService) { }

    /**
     * Tạo subtask mới
     */
    async create(taskId: string, userId: string, dto: CreateSubtaskDto) {
        await this.checkTaskAccess(taskId, userId);

        // Get max position
        const lastSubtask = await this.prisma.subtask.findFirst({
            where: { taskId },
            orderBy: { position: 'desc' },
        });

        const position = (lastSubtask?.position ?? -1) + 1;

        return this.prisma.subtask.create({
            data: {
                taskId,
                title: dto.title,
                position,
            },
        });
    }

    /**
     * Lấy subtasks của task
     */
    async findByTask(taskId: string) {
        return this.prisma.subtask.findMany({
            where: { taskId },
            orderBy: { position: 'asc' },
        });
    }

    /**
     * Cập nhật subtask
     */
    async update(subtaskId: string, userId: string, dto: UpdateSubtaskDto) {
        const subtask = await this.findById(subtaskId);
        await this.checkTaskAccess(subtask.taskId, userId);

        const updateData: Prisma.SubtaskUpdateInput = {
            title: dto.title,
            isCompleted: dto.isCompleted,
            completedAt: dto.isCompleted !== undefined ? (dto.isCompleted ? new Date() : null) : undefined,
        };

        return this.prisma.subtask.update({
            where: { id: subtaskId },
            data: updateData,
        });
    }

    /**
     * Toggle completion status
     */
    async toggle(subtaskId: string, userId: string) {
        const subtask = await this.findById(subtaskId);
        await this.checkTaskAccess(subtask.taskId, userId);

        const isCompleted = !subtask.isCompleted;

        return this.prisma.subtask.update({
            where: { id: subtaskId },
            data: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null,
            },
        });
    }

    /**
     * Xóa subtask
     */
    async delete(subtaskId: string, userId: string) {
        const subtask = await this.findById(subtaskId);
        await this.checkTaskAccess(subtask.taskId, userId);

        await this.prisma.subtask.delete({
            where: { id: subtaskId },
        });

        return { message: 'Đã xóa subtask' };
    }

    /**
     * Reorder subtasks
     */
    async reorder(taskId: string, userId: string, subtaskIds: string[]) {
        await this.checkTaskAccess(taskId, userId);

        // Update positions
        await Promise.all(
            subtaskIds.map((id, index) =>
                this.prisma.subtask.update({
                    where: { id },
                    data: { position: index },
                })
            )
        );

        return this.findByTask(taskId);
    }

    /**
     * Lấy progress của task (phần trăm hoàn thành)
     */
    async getProgress(taskId: string) {
        const subtasks = await this.prisma.subtask.findMany({
            where: { taskId },
            select: { isCompleted: true },
        });

        if (subtasks.length === 0) {
            return { total: 0, completed: 0, percentage: 0 };
        }

        const completed = subtasks.filter(s => s.isCompleted).length;
        const percentage = Math.round((completed / subtasks.length) * 100);

        return {
            total: subtasks.length,
            completed,
            percentage,
        };
    }

    // Helper methods
    private async findById(subtaskId: string) {
        const subtask = await this.prisma.subtask.findUnique({
            where: { id: subtaskId },
        });

        if (!subtask) {
            throw new NotFoundException('Subtask không tồn tại');
        }

        return subtask;
    }

    private async checkTaskAccess(taskId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                column: {
                    include: {
                        project: {
                            include: {
                                members: { where: { userId } },
                            },
                        },
                    },
                },
            },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        if (task.column.project.members.length === 0) {
            throw new ForbiddenException('Bạn không có quyền truy cập task này');
        }

        return task;
    }
}
