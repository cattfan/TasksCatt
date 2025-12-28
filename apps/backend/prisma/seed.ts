import { PrismaClient, MemberRole, TaskPriority } from '@prisma/client';
import * as bcrypt from 'bcrypt';

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

    const admin = await prisma.user.create({
        data: {
            email: 'admin@taskscatt.com',
            passwordHash,
            fullName: 'Admin User',
            avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
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
            name: 'TasksCatt Demo Project',
            description: 'A demo project to showcase the Kanban board features',
            slug: 'taskscatt-demo',
            ownerId: admin.id,
        },
    });

    console.log('📁 Created project:', project.name);

    // Add members to project
    await prisma.projectMember.createMany({
        data: [
            { projectId: project.id, userId: admin.id, role: MemberRole.OWNER },
            { projectId: project.id, userId: john.id, role: MemberRole.MEMBER },
            { projectId: project.id, userId: jane.id, role: MemberRole.MEMBER },
        ],
    });

    console.log('👥 Added project members');

    // Create default columns
    const columns = await Promise.all([
        prisma.column.create({
            data: {
                projectId: project.id,
                name: '📋 Backlog',
                color: '#6B7280',
                position: 0,
            },
        }),
        prisma.column.create({
            data: {
                projectId: project.id,
                name: '🔄 In Progress',
                color: '#3B82F6',
                position: 1,
            },
        }),
        prisma.column.create({
            data: {
                projectId: project.id,
                name: '👀 Review',
                color: '#F59E0B',
                position: 2,
            },
        }),
        prisma.column.create({
            data: {
                projectId: project.id,
                name: '✅ Done',
                color: '#10B981',
                position: 3,
            },
        }),
    ]);

    console.log('📊 Created columns:', columns.map((c) => c.name));

    // Create sample tasks
    const [backlog, inProgress, review, done] = columns;

    await prisma.task.createMany({
        data: [
            // Backlog tasks
            {
                columnId: backlog.id,
                creatorId: admin.id,
                title: 'Setup authentication flow',
                description: 'Implement JWT authentication with refresh tokens',
                priority: TaskPriority.HIGH,
                position: 0,
            },
            {
                columnId: backlog.id,
                creatorId: admin.id,
                assigneeId: john.id,
                title: 'Design database schema',
                description: 'Create PostgreSQL schema with Prisma',
                priority: TaskPriority.CRITICAL,
                position: 1,
            },
            {
                columnId: backlog.id,
                creatorId: john.id,
                title: 'Add dark mode support',
                description: 'Implement dark/light theme toggle',
                priority: TaskPriority.LOW,
                position: 2,
            },
            // In Progress tasks
            {
                columnId: inProgress.id,
                creatorId: admin.id,
                assigneeId: jane.id,
                title: 'Build Kanban board UI',
                description: 'Create drag-and-drop Kanban board with React DnD',
                priority: TaskPriority.HIGH,
                position: 0,
            },
            {
                columnId: inProgress.id,
                creatorId: john.id,
                assigneeId: john.id,
                title: 'Implement project CRUD',
                description: 'Create, read, update, delete operations for projects',
                priority: TaskPriority.MEDIUM,
                position: 1,
            },
            // Review tasks
            {
                columnId: review.id,
                creatorId: jane.id,
                assigneeId: admin.id,
                title: 'Setup CI/CD pipeline',
                description: 'Configure GitHub Actions for automated testing and deployment',
                priority: TaskPriority.MEDIUM,
                position: 0,
            },
            // Done tasks
            {
                columnId: done.id,
                creatorId: admin.id,
                assigneeId: admin.id,
                title: 'Initialize monorepo structure',
                description: 'Setup pnpm workspaces and Turborepo',
                priority: TaskPriority.CRITICAL,
                position: 0,
            },
            {
                columnId: done.id,
                creatorId: admin.id,
                title: 'Configure shared package',
                description: 'Create shared types and constants package',
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
