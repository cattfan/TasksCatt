import {
    Injectable,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabelDto, UpdateLabelDto } from './dto';

@Injectable()
export class LabelsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Tạo label mới cho project
     */
    async create(projectId: string, userId: string, dto: CreateLabelDto) {
        // Check project membership
        await this.checkProjectAccess(projectId, userId);

        // Check duplicate name
        const existing = await this.prisma.label.findFirst({
            where: { projectId, name: dto.name },
        });

        if (existing) {
            throw new ConflictException(`Label "${dto.name}" đã tồn tại trong project này`);
        }

        return this.prisma.label.create({
            data: {
                projectId,
                name: dto.name,
                color: dto.color || '#6B7280',
            },
        });
    }

    /**
     * Lấy tất cả labels của project
     */
    async findByProject(projectId: string, userId: string) {
        await this.checkProjectAccess(projectId, userId);

        return this.prisma.label.findMany({
            where: { projectId },
            orderBy: { name: 'asc' },
        });
    }

    /**
     * Cập nhật label
     */
    async update(labelId: string, userId: string, dto: UpdateLabelDto) {
        const label = await this.findById(labelId);
        await this.checkProjectAccess(label.projectId, userId);

        // Check duplicate name if changing
        if (dto.name && dto.name !== label.name) {
            const existing = await this.prisma.label.findFirst({
                where: {
                    projectId: label.projectId,
                    name: dto.name,
                    id: { not: labelId },
                },
            });

            if (existing) {
                throw new ConflictException(`Label "${dto.name}" đã tồn tại`);
            }
        }

        return this.prisma.label.update({
            where: { id: labelId },
            data: dto,
        });
    }

    /**
     * Xóa label
     */
    async delete(labelId: string, userId: string) {
        const label = await this.findById(labelId);
        await this.checkProjectAccess(label.projectId, userId);

        await this.prisma.label.delete({
            where: { id: labelId },
        });

        return { message: 'Đã xóa label' };
    }

    /**
     * Thêm label vào task
     */
    async addToTask(taskId: string, labelId: string, userId: string) {
        // Verify task exists and get project
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { column: { select: { projectId: true } } },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        await this.checkProjectAccess(task.column.projectId, userId);

        // Verify label belongs to same project
        const label = await this.findById(labelId);
        if (label.projectId !== task.column.projectId) {
            throw new ForbiddenException('Label không thuộc project này');
        }

        // Check if already added
        const existing = await this.prisma.taskLabel.findFirst({
            where: { taskId, labelId },
        });

        if (existing) {
            return existing;
        }

        return this.prisma.taskLabel.create({
            data: { taskId, labelId },
            include: { label: true },
        });
    }

    /**
     * Xóa label khỏi task
     */
    async removeFromTask(taskId: string, labelId: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { column: { select: { projectId: true } } },
        });

        if (!task) {
            throw new NotFoundException('Task không tồn tại');
        }

        await this.checkProjectAccess(task.column.projectId, userId);

        await this.prisma.taskLabel.deleteMany({
            where: { taskId, labelId },
        });

        return { message: 'Đã xóa label khỏi task' };
    }

    /**
     * Lấy labels của task
     */
    async getTaskLabels(taskId: string) {
        return this.prisma.taskLabel.findMany({
            where: { taskId },
            include: { label: true },
        });
    }

    // Helper methods
    private async findById(labelId: string) {
        const label = await this.prisma.label.findUnique({
            where: { id: labelId },
        });

        if (!label) {
            throw new NotFoundException('Label không tồn tại');
        }

        return label;
    }

    private async checkProjectAccess(projectId: string, userId: string) {
        const member = await this.prisma.projectMember.findFirst({
            where: { projectId, userId },
        });

        if (!member) {
            throw new ForbiddenException('Bạn không có quyền truy cập project này');
        }

        return member;
    }
}
