import {
    Injectable,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRole } from '@prisma/client';
import {
    CreateProjectDto,
    UpdateProjectDto,
    AddMemberDto,
    UpdateMemberRoleDto,
    CreateColumnDto,
    UpdateColumnDto,
    ReorderColumnsDto,
} from './dto';

// Default columns khi tạo project mới
const DEFAULT_COLUMNS = [
    { name: '📋 Backlog', color: '#6B7280', position: 0 },
    { name: '🔄 In Progress', color: '#3B82F6', position: 1 },
    { name: '👀 Review', color: '#F59E0B', position: 2 },
    { name: '✅ Done', color: '#10B981', position: 3 },
];

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    // ==========================================
    // PROJECT CRUD
    // ==========================================

    /**
     * Tạo project mới
     */
    async create(userId: string, dto: CreateProjectDto) {
        // Generate slug nếu không có
        const slug = dto.slug || this.generateSlug(dto.name);

        // Kiểm tra slug đã tồn tại chưa
        const existingProject = await this.prisma.project.findUnique({
            where: { slug },
        });

        if (existingProject) {
            throw new ConflictException('Slug đã được sử dụng');
        }

        // Tạo project với owner và default columns
        const project = await this.prisma.project.create({
            data: {
                name: dto.name,
                description: dto.description,
                slug,
                ownerId: userId,
                members: {
                    create: {
                        userId,
                        role: MemberRole.OWNER,
                    },
                },
                columns: {
                    create: DEFAULT_COLUMNS,
                },
            },
            include: {
                owner: {
                    select: { id: true, email: true, fullName: true, avatarUrl: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true, avatarUrl: true },
                        },
                    },
                },
                columns: {
                    orderBy: { position: 'asc' },
                },
            },
        });

        return project;
    }

    /**
     * Lấy danh sách projects mà user tham gia
     */
    async findAllByUser(userId: string) {
        const memberships = await this.prisma.projectMember.findMany({
            where: { userId },
            include: {
                project: {
                    include: {
                        owner: {
                            select: { id: true, fullName: true, avatarUrl: true },
                        },
                        _count: {
                            select: { members: true },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'desc' },
        });

        return memberships.map((m) => ({
            ...m.project,
            userRole: m.role,
            memberCount: m.project._count.members,
        }));
    }

    /**
     * Lấy chi tiết project theo slug
     */
    async findBySlug(slug: string, userId: string) {
        const project = await this.prisma.project.findUnique({
            where: { slug, deletedAt: null },
            include: {
                owner: {
                    select: { id: true, email: true, fullName: true, avatarUrl: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, email: true, fullName: true, avatarUrl: true },
                        },
                    },
                },
                columns: {
                    orderBy: { position: 'asc' },
                    include: {
                        tasks: {
                            where: { deletedAt: null },
                            orderBy: { position: 'asc' },
                            include: {
                                assignee: {
                                    select: { id: true, fullName: true, avatarUrl: true },
                                },
                                creator: {
                                    select: { id: true, fullName: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!project) {
            throw new NotFoundException('Dự án không tồn tại');
        }

        // Kiểm tra quyền truy cập
        const membership = project.members.find((m) => m.userId === userId);
        if (!membership) {
            throw new ForbiddenException('Bạn không có quyền truy cập dự án này');
        }

        return { ...project, userRole: membership.role };
    }

    /**
     * Cập nhật project
     */
    async update(projectId: string, userId: string, dto: UpdateProjectDto) {
        await this.checkPermission(projectId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

        return this.prisma.project.update({
            where: { id: projectId },
            data: dto,
            include: {
                owner: {
                    select: { id: true, email: true, fullName: true, avatarUrl: true },
                },
            },
        });
    }

    /**
     * Xóa project (soft delete)
     */
    async delete(projectId: string, userId: string) {
        await this.checkPermission(projectId, userId, [MemberRole.OWNER]);

        return this.prisma.project.update({
            where: { id: projectId },
            data: { deletedAt: new Date() },
        });
    }

    // ==========================================
    // MEMBER MANAGEMENT
    // ==========================================

    /**
     * Thêm member vào project
     */
    async addMember(projectId: string, userId: string, dto: AddMemberDto) {
        await this.checkPermission(projectId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

        // Tìm user theo email
        const userToAdd = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!userToAdd) {
            throw new NotFoundException('Không tìm thấy user với email này');
        }

        // Kiểm tra đã là member chưa
        const existingMember = await this.prisma.projectMember.findUnique({
            where: {
                projectId_userId: { projectId, userId: userToAdd.id },
            },
        });

        if (existingMember) {
            throw new ConflictException('User đã là thành viên của project');
        }

        // Không cho phép thêm OWNER mới
        if (dto.role === MemberRole.OWNER) {
            throw new ForbiddenException('Không thể thêm OWNER mới');
        }

        return this.prisma.projectMember.create({
            data: {
                projectId,
                userId: userToAdd.id,
                role: dto.role,
            },
            include: {
                user: {
                    select: { id: true, email: true, fullName: true, avatarUrl: true },
                },
            },
        });
    }

    /**
     * Cập nhật role của member
     */
    async updateMemberRole(
        projectId: string,
        memberId: string,
        userId: string,
        dto: UpdateMemberRoleDto,
    ) {
        await this.checkPermission(projectId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

        const member = await this.prisma.projectMember.findUnique({
            where: { id: memberId },
        });

        if (!member || member.projectId !== projectId) {
            throw new NotFoundException('Member không tồn tại');
        }

        // Không cho phép thay đổi role của OWNER
        if (member.role === MemberRole.OWNER) {
            throw new ForbiddenException('Không thể thay đổi role của Owner');
        }

        // Không cho phép đổi thành OWNER
        if (dto.role === MemberRole.OWNER) {
            throw new ForbiddenException('Không thể chuyển thành Owner');
        }

        return this.prisma.projectMember.update({
            where: { id: memberId },
            data: { role: dto.role },
            include: {
                user: {
                    select: { id: true, email: true, fullName: true, avatarUrl: true },
                },
            },
        });
    }

    /**
     * Xóa member khỏi project
     */
    async removeMember(projectId: string, memberId: string, userId: string) {
        await this.checkPermission(projectId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

        const member = await this.prisma.projectMember.findUnique({
            where: { id: memberId },
        });

        if (!member || member.projectId !== projectId) {
            throw new NotFoundException('Member không tồn tại');
        }

        // Không cho phép xóa OWNER
        if (member.role === MemberRole.OWNER) {
            throw new ForbiddenException('Không thể xóa Owner khỏi project');
        }

        return this.prisma.projectMember.delete({
            where: { id: memberId },
        });
    }

    // ==========================================
    // COLUMN MANAGEMENT
    // ==========================================

    /**
     * Thêm column mới
     */
    async addColumn(projectId: string, userId: string, dto: CreateColumnDto) {
        await this.checkPermission(projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        // Lấy position lớn nhất hiện tại
        const lastColumn = await this.prisma.column.findFirst({
            where: { projectId },
            orderBy: { position: 'desc' },
        });

        const position = lastColumn ? lastColumn.position + 1 : 0;

        return this.prisma.column.create({
            data: {
                projectId,
                name: dto.name,
                color: dto.color || '#6B7280',
                position,
            },
        });
    }

    /**
     * Cập nhật column
     */
    async updateColumn(
        projectId: string,
        columnId: string,
        userId: string,
        dto: UpdateColumnDto,
    ) {
        await this.checkPermission(projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        const column = await this.prisma.column.findUnique({
            where: { id: columnId },
        });

        if (!column || column.projectId !== projectId) {
            throw new NotFoundException('Column không tồn tại');
        }

        return this.prisma.column.update({
            where: { id: columnId },
            data: dto,
        });
    }

    /**
     * Xóa column (và tất cả tasks trong đó)
     */
    async deleteColumn(projectId: string, columnId: string, userId: string) {
        await this.checkPermission(projectId, userId, [MemberRole.OWNER, MemberRole.ADMIN]);

        const column = await this.prisma.column.findUnique({
            where: { id: columnId },
        });

        if (!column || column.projectId !== projectId) {
            throw new NotFoundException('Column không tồn tại');
        }

        return this.prisma.column.delete({
            where: { id: columnId },
        });
    }

    /**
     * Sắp xếp lại columns
     */
    async reorderColumns(projectId: string, userId: string, dto: ReorderColumnsDto) {
        await this.checkPermission(projectId, userId, [
            MemberRole.OWNER,
            MemberRole.ADMIN,
            MemberRole.MEMBER,
        ]);

        // Cập nhật position cho từng column
        const updates = dto.columnIds.map((columnId, index) =>
            this.prisma.column.update({
                where: { id: columnId },
                data: { position: index },
            }),
        );

        await this.prisma.$transaction(updates);

        return { success: true };
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Kiểm tra quyền của user trong project
     */
    private async checkPermission(
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

    /**
     * Generate slug từ tên project
     */
    private generateSlug(name: string): string {
        const baseSlug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

        // Thêm random suffix để tránh trùng
        const suffix = Math.random().toString(36).substring(2, 6);
        return `${baseSlug}-${suffix}`;
    }
}
