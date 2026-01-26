/**
 * Seed script to create 10,000 tasks for performance testing
 * Run with: npx ts-node prisma/seed-performance.ts
 */

import { PrismaClient, MemberRole, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

const TASK_COUNT = 100;
const BATCH_SIZE = 50;
const USER_COUNT = 5;
const COMMENT_RATIO = 0.3;
const SUBTASK_RATIO = 0.2;

// Password hash for "test123456"
const PASSWORD_HASH = '$2b$10$7JxzGHPskJ9.xVkq5xQ0/.kqP8Aj5xqVxQzx8qJQ8P5L5qgzJqXGq';

async function main() {
    console.log('🚀 Starting performance seed...');
    console.time('Seed completed in');

    // Create test users (test1@gmail.com to test5@gmail.com)
    const userNames = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E'];
    const users: { id: string; fullName: string }[] = [];

    for (let i = 1; i <= USER_COUNT; i++) {
        const email = `test${i}@gmail.com`;
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    passwordHash: PASSWORD_HASH,
                    fullName: userNames[i - 1] || `Tester ${i}`,
                },
            });
            console.log(`✅ Created user: ${user.email}`);
        }
        users.push({ id: user.id, fullName: user.fullName });
    }

    if (users.length === 0) {
        throw new Error('No users created');
    }

    const owner = users[0]!;

    // Get or create test project
    let testProject = await prisma.project.findFirst({
        where: { slug: 'performance-test-project' },
        include: { columns: true },
    });

    if (!testProject) {
        testProject = await prisma.project.create({
            data: {
                name: 'Performance Test Project',
                slug: 'performance-test-project',
                prefix: 'PERF',
                description: 'Project for performance testing with 10k tasks',
                owner: { connect: { id: owner.id } },
                members: {
                    create: users.map((u, idx) => ({
                        userId: u.id,
                        role: idx === 0 ? MemberRole.OWNER : MemberRole.MEMBER,
                    })),
                },
                columns: {
                    createMany: {
                        data: [
                            { name: 'Backlog', position: 0, color: '#94a3b8' },
                            { name: 'To Do', position: 1, color: '#3b82f6' },
                            { name: 'In Progress', position: 2, color: '#f59e0b' },
                            { name: 'Done', position: 3, color: '#22c55e' },
                        ],
                    },
                },
            },
            include: { columns: true },
        });
        console.log('✅ Created test project with columns');
    }

    const columns = testProject.columns;
    if (columns.length === 0) {
        throw new Error('No columns found');
    }

    // Check existing task count
    const existingCount = await prisma.task.count({
        where: { column: { projectId: testProject.id } },
    });

    const tasksToCreate = TASK_COUNT - existingCount;
    if (tasksToCreate <= 0) {
        console.log(`ℹ️ Already have ${existingCount} tasks. Skipping.`);
        return;
    }

    console.log(`📝 Creating ${tasksToCreate} tasks...`);

    const priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL];
    const taskTitles = [
        'Implement feature', 'Fix bug in', 'Review PR for', 'Update documentation',
        'Refactor code in', 'Add tests for', 'Optimize', 'Design UI for',
    ];
    const modules = ['auth', 'dashboard', 'notifications', 'projects', 'tasks', 'comments', 'users', 'settings'];
    const commentTexts = [
        'Đang làm phần này.',
        'Cần review thêm.',
        'Đã fix xong.',
        'LGTM!',
        'Cần thêm test cases.',
    ];

    // Helper to get 1-3 random assignees
    const getRandomAssignees = () => {
        const count = Math.floor(Math.random() * 3) + 1;
        const shuffled = [...users].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(u => ({ id: u.id }));
    };

    let created = 0;
    let taskCounter = existingCount;

    for (let batch = 0; batch < Math.ceil(tasksToCreate / BATCH_SIZE); batch++) {
        const batchSize = Math.min(BATCH_SIZE, tasksToCreate - created);

        for (let i = 0; i < batchSize; i++) {
            taskCounter++;
            const col = columns[Math.floor(Math.random() * columns.length)]!;
            const priority = priorities[Math.floor(Math.random() * priorities.length)]!;
            const titlePrefix = taskTitles[Math.floor(Math.random() * taskTitles.length)]!;
            const module = modules[Math.floor(Math.random() * modules.length)]!;
            const creator = users[Math.floor(Math.random() * users.length)]!;
            const assignees = getRandomAssignees();

            const task = await prisma.task.create({
                data: {
                    title: `${titlePrefix} ${module} #${taskCounter}`,
                    description: `Task ${taskCounter} for ${module}.`,
                    taskNumber: taskCounter,
                    priority,
                    position: i,
                    columnId: col.id,
                    creatorId: creator.id,
                    assignees: { connect: assignees },
                    dueDate: Math.random() > 0.5
                        ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
                        : null,
                },
            });

            // Add comments
            if (Math.random() < COMMENT_RATIO) {
                const commentCount = Math.floor(Math.random() * 3) + 1;
                for (let c = 0; c < commentCount; c++) {
                    const commenter = users[Math.floor(Math.random() * users.length)]!;
                    const content = commentTexts[Math.floor(Math.random() * commentTexts.length)]!;
                    await prisma.comment.create({
                        data: {
                            content,
                            taskId: task.id,
                            authorId: commenter.id,
                        },
                    });
                }
            }

            // Add subtasks
            if (Math.random() < SUBTASK_RATIO) {
                const subtaskCount = Math.floor(Math.random() * 4) + 1;
                for (let s = 0; s < subtaskCount; s++) {
                    const isCompleted = Math.random() > 0.5;
                    await prisma.subtask.create({
                        data: {
                            title: `Subtask ${s + 1}`,
                            taskId: task.id,
                            position: s,
                            isCompleted,
                            completedAt: isCompleted ? new Date() : null,
                        },
                    });
                }
            }
        }

        created += batchSize;
        process.stdout.write(`\r   Progress: ${created}/${tasksToCreate} (${Math.round(created / tasksToCreate * 100)}%)`);
    }

    // Update project counter
    await prisma.project.update({
        where: { id: testProject.id },
        data: { taskCounter },
    });

    console.log('\n✅ Seed completed!');
    console.timeEnd('Seed completed in');

    // Stats
    const [taskCount, commentCount, subtaskCount] = await Promise.all([
        prisma.task.count({ where: { column: { projectId: testProject.id } } }),
        prisma.comment.count({ where: { task: { column: { projectId: testProject.id } } } }),
        prisma.subtask.count({ where: { task: { column: { projectId: testProject.id } } } }),
    ]);

    console.log(`\n📊 Stats: ${taskCount} tasks, ${commentCount} comments, ${subtaskCount} subtasks`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
