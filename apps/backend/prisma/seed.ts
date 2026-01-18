import { PrismaClient, MemberRole, TaskPriority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data (in development only)
    await prisma.task.deleteMany();
    await prisma.column.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Create users
    const passwordHash = await bcrypt.hash('password123', 12);
    const newAdminPasswordHash = await bcrypt.hash('Dhd@2392005', 12);

    const admin = await prisma.user.create({
        data: {
            email: 'cattfan239@gmail.com',
            passwordHash: newAdminPasswordHash,
            fullName: 'Cattfan Admin',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cattfan',
            isAdmin: true,
        },
    });

    const john = await prisma.user.create({
        data: {
            email: 'john@taskscatt.com',
            passwordHash,
            fullName: 'John Doe',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
        },
    });

    const jane = await prisma.user.create({
        data: {
            email: 'jane@taskscatt.com',
            passwordHash,
            fullName: 'Jane Smith',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane',
        },
    });

    console.log('👤 Created users:', [admin.email, john.email, jane.email]);

    // Create a demo project
    const project = await prisma.project.create({
        data: {
            name: 'Dự án Mẫu - TasksCatt',
            description: 'Dự án demo để giới thiệu các tính năng của bảng Kanban và quản lý công việc.',
            slug: 'du-an-mau-taskscatt',
            ownerId: admin.id,
        },
    });

    const project2 = await prisma.project.create({
        data: {
            name: 'Phát triển Mobile App',
            description: 'Dự án xây dựng ứng dụng di động cho khách hàng.',
            slug: 'phat-trien-mobile-app',
            ownerId: john.id,
        },
    });

    console.log('📁 Created projects:', [project.name, project2.name]);

    // Add members to project
    await prisma.projectMember.createMany({
        data: [
            { projectId: project.id, userId: admin.id, role: MemberRole.OWNER },
            { projectId: project.id, userId: john.id, role: MemberRole.MEMBER },
            { projectId: project.id, userId: jane.id, role: MemberRole.MEMBER },
            { projectId: project2.id, userId: john.id, role: MemberRole.OWNER },
            { projectId: project2.id, userId: admin.id, role: MemberRole.MEMBER },
        ],
    });

    console.log('👥 Added project members');

    // Create default columns for project 1
    const columns = await Promise.all([
        prisma.column.create({
            data: {
                projectId: project.id,
                name: 'Cần làm',
                color: '#6B7280',
                position: 0,
            },
        }),
        prisma.column.create({
            data: {
                projectId: project.id,
                name: 'Đang thực hiện',
                color: '#3B82F6',
                position: 1,
            },
        }),
        prisma.column.create({
            data: {
                projectId: project.id,
                name: 'Chờ duyệt',
                color: '#F59E0B',
                position: 2,
            },
        }),
        prisma.column.create({
            data: {
                projectId: project.id,
                name: 'Hoàn thành',
                color: '#10B981',
                position: 3,
            },
        }),
    ]);

    // Create default columns for project 2
    await Promise.all([
        prisma.column.create({ data: { projectId: project2.id, name: 'Idea', color: '#8b5cf6', position: 0 } }),
        prisma.column.create({ data: { projectId: project2.id, name: 'Design', color: '#ec4899', position: 1 } }),
        prisma.column.create({ data: { projectId: project2.id, name: 'Coding', color: '#10b981', position: 2 } }),
    ]);

    console.log('📊 Created columns for project');

    // Create sample tasks
    const [backlog, inProgress, review, done] = columns;

    await prisma.task.createMany({
        data: [
            // Backlog tasks
            {
                columnId: backlog.id,
                creatorId: admin.id,
                title: 'Thiết kế giao diện đăng nhập',
                description: 'Cần thiết kế giao diện hiện đại, sử dụng glassmorphism.',
                priority: TaskPriority.HIGH,
                position: 0,
            },
            {
                columnId: backlog.id,
                creatorId: admin.id,
                assignees: {
                    connect: [{ id: john.id }],
                },
                title: 'Thiết kế Database chuẩn',
                description: 'Tạo schema PostgreSQL với Prisma, tối ưu các quan hệ.',
                priority: TaskPriority.CRITICAL,
                position: 1,
            },
            {
                columnId: backlog.id,
                creatorId: john.id,
                title: 'Hỗ trợ giao diện Dark Mode',
                description: 'Người dùng có thể chuyển đổi giữa nền sáng và tối.',
                priority: TaskPriority.LOW,
                position: 2,
            },
            // In Progress tasks
            {
                columnId: inProgress.id,
                creatorId: admin.id,
                assignees: {
                    connect: [{ id: jane.id }],
                },
                title: 'Lập trình bảng Kanban',
                description: 'Xây dựng tính năng kéo thả công việc giữa các cột.',
                priority: TaskPriority.HIGH,
                position: 0,
            },
            {
                columnId: inProgress.id,
                creatorId: john.id,
                assignees: {
                    connect: [{ id: john.id }],
                },
                title: 'Xây dựng API quản lý dự án',
                description: 'Cài đặt các phương thức CRUD cho module Projects.',
                priority: TaskPriority.MEDIUM,
                position: 1,
            },
            // Review tasks
            {
                columnId: review.id,
                creatorId: jane.id,
                assignees: {
                    connect: [{ id: admin.id }, { id: jane.id }], // Demo 2 assignees
                },
                title: 'Thiết lập CI/CD Pipeline',
                description: 'Tự động deploy lên server khi có code mới trên GitHub.',
                priority: TaskPriority.MEDIUM,
                position: 0,
            },
            // Done tasks
            {
                columnId: done.id,
                creatorId: admin.id,
                assignees: {
                    connect: [{ id: admin.id }],
                },
                title: 'Khởi tạo cấu trúc Monorepo',
                description: 'Sử dụng pnpm workspaces và Turborepo để quản lý dự án.',
                priority: TaskPriority.CRITICAL,
                position: 0,
            },
            {
                columnId: done.id,
                creatorId: admin.id,
                title: 'Tích hợp tài liệu API Scalar',
                description: 'Tự động tạo document chuyên nghiệp cho các API.',
                priority: TaskPriority.HIGH,
                position: 1,
            },
        ],
    });

    console.log('✅ Created sample tasks');

    console.log('🎉 Database seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
