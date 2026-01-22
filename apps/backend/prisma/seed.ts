import { PrismaClient, MemberRole, TaskPriority } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seed...');

    // Clean existing data (in development only)
    await prisma.activityLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.task.deleteMany();
    await prisma.column.deleteMany();
    await prisma.label.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned existing data');

    // Create users with Vietnamese names
    const passwordHash = await bcrypt.hash('test123456', 12);

    const admin = await prisma.user.create({
        data: {
            email: 'test@gmail.com',
            passwordHash,
            fullName: 'Nguyễn Văn Admin',
            avatarUrl: 'https://api.dicebear.com/9.x/big-ears/svg?seed=admin',
            isAdmin: true,
        },
    });

    const user1 = await prisma.user.create({
        data: {
            email: 'test1@gmail.com',
            passwordHash,
            fullName: 'Trần Minh Tuấn',
            avatarUrl: 'https://api.dicebear.com/9.x/big-ears/svg?seed=tuan',
        },
    });

    const user2 = await prisma.user.create({
        data: {
            email: 'test2@gmail.com',
            passwordHash,
            fullName: 'Lê Thị Hương',
            avatarUrl: 'https://api.dicebear.com/9.x/big-ears/svg?seed=huong',
        },
    });

    const user3 = await prisma.user.create({
        data: {
            email: 'test3@gmail.com',
            passwordHash,
            fullName: 'Phạm Quốc Bảo',
            avatarUrl: 'https://api.dicebear.com/9.x/big-ears/svg?seed=bao',
        },
    });

    console.log('👤 Created users:', [admin.fullName, user1.fullName, user2.fullName, user3.fullName]);

    // ========== PROJECT 1: Phát triển Website E-commerce ==========
    const project1 = await prisma.project.create({
        data: {
            name: 'Website E-commerce Bán Hàng',
            description: 'Xây dựng website thương mại điện tử full-stack với React và NestJS. Bao gồm giỏ hàng, thanh toán VNPay, quản lý kho.',
            slug: 'website-ecommerce-ban-hang',
            prefix: 'ECOM',
            ownerId: user1.id,
        },
    });

    // ========== PROJECT 2: App Di động Quản lý Sức khỏe ==========
    const project2 = await prisma.project.create({
        data: {
            name: 'App Theo dõi Sức khỏe',
            description: 'Ứng dụng mobile theo dõi chỉ số sức khỏe hàng ngày: cân nặng, lượng nước, giấc ngủ, bước chân.',
            slug: 'app-theo-doi-suc-khoe',
            prefix: 'HEALTH',
            ownerId: user1.id,
        },
    });

    // ========== PROJECT 3: Hệ thống Quản lý Nhân sự ==========
    const project3 = await prisma.project.create({
        data: {
            name: 'HRM - Quản lý Nhân sự',
            description: 'Hệ thống quản lý nhân sự cho doanh nghiệp: chấm công, nghỉ phép, tính lương, đánh giá KPI.',
            slug: 'hrm-quan-ly-nhan-su',
            prefix: 'HRM',
            ownerId: user2.id,
        },
    });

    console.log('📁 Created projects:', [project1.name, project2.name, project3.name]);

    // Add members to projects (Admin only manages system, not projects)
    await prisma.projectMember.createMany({
        data: [
            // Project 1: E-commerce - user1 owns, user2 & user3 join
            { projectId: project1.id, userId: user1.id, role: MemberRole.OWNER },
            { projectId: project1.id, userId: user2.id, role: MemberRole.MEMBER },
            { projectId: project1.id, userId: user3.id, role: MemberRole.MEMBER },
            // Project 2: Health App - user1 owns, user3 joins
            { projectId: project2.id, userId: user1.id, role: MemberRole.OWNER },
            { projectId: project2.id, userId: user3.id, role: MemberRole.MEMBER },
            // Project 3: HRM - user2 owns, user1 & user3 join
            { projectId: project3.id, userId: user2.id, role: MemberRole.OWNER },
            { projectId: project3.id, userId: user1.id, role: MemberRole.MEMBER },
            { projectId: project3.id, userId: user3.id, role: MemberRole.MEMBER },
        ],
    });

    console.log('👥 Added project members');

    // ========== COLUMNS FOR PROJECT 1 ==========
    const p1Cols = await Promise.all([
        prisma.column.create({ data: { projectId: project1.id, name: 'Backlog', color: '#6B7280', position: 0 } }),
        prisma.column.create({ data: { projectId: project1.id, name: 'Đang làm', color: '#3B82F6', position: 1 } }),
        prisma.column.create({ data: { projectId: project1.id, name: 'Review', color: '#F59E0B', position: 2 } }),
        prisma.column.create({ data: { projectId: project1.id, name: 'Done', color: '#10B981', position: 3 } }),
    ]);

    // ========== COLUMNS FOR PROJECT 2 ==========
    const p2Cols = await Promise.all([
        prisma.column.create({ data: { projectId: project2.id, name: 'Ý tưởng', color: '#8B5CF6', position: 0 } }),
        prisma.column.create({ data: { projectId: project2.id, name: 'Thiết kế', color: '#EC4899', position: 1 } }),
        prisma.column.create({ data: { projectId: project2.id, name: 'Phát triển', color: '#3B82F6', position: 2 } }),
        prisma.column.create({ data: { projectId: project2.id, name: 'Testing', color: '#F59E0B', position: 3 } }),
        prisma.column.create({ data: { projectId: project2.id, name: 'Hoàn thành', color: '#10B981', position: 4 } }),
    ]);

    // ========== COLUMNS FOR PROJECT 3 ==========
    const p3Cols = await Promise.all([
        prisma.column.create({ data: { projectId: project3.id, name: 'Chưa bắt đầu', color: '#6B7280', position: 0 } }),
        prisma.column.create({ data: { projectId: project3.id, name: 'Đang xử lý', color: '#3B82F6', position: 1 } }),
        prisma.column.create({ data: { projectId: project3.id, name: 'Xong', color: '#10B981', position: 2 } }),
    ]);

    console.log('📊 Created columns for all projects');

    // ========== TASKS FOR PROJECT 1: E-COMMERCE (15 tasks) ==========
    const [p1Backlog, p1Doing, p1Review, p1Done] = p1Cols;
    const p1Tasks = [
        // Backlog (5 tasks)
        { columnId: p1Backlog.id, creatorId: admin.id, title: 'Thiết kế database schema', description: 'Thiết kế ERD cho sản phẩm, đơn hàng, khách hàng, kho.', priority: TaskPriority.HIGH, position: 0 },
        { columnId: p1Backlog.id, creatorId: user1.id, title: 'Tích hợp VNPay thanh toán', description: 'Kết nối API VNPay để xử lý thanh toán online.', priority: TaskPriority.CRITICAL, position: 1 },
        { columnId: p1Backlog.id, creatorId: user2.id, title: 'Viết unit test cho Cart', description: 'Test các function thêm/xóa/update giỏ hàng.', priority: TaskPriority.LOW, position: 2 },
        { columnId: p1Backlog.id, creatorId: user3.id, title: 'Setup CI/CD pipeline', description: 'Cấu hình GitHub Actions để auto deploy.', priority: TaskPriority.MEDIUM, position: 3 },
        { columnId: p1Backlog.id, creatorId: admin.id, title: 'Tối ưu SEO cho trang sản phẩm', description: 'Thêm meta tags, structured data cho Google.', priority: TaskPriority.LOW, position: 4 },
        // Đang làm (4 tasks)
        { columnId: p1Doing.id, creatorId: user1.id, title: 'Xây dựng trang chi tiết sản phẩm', description: 'UI hiển thị ảnh, giá, mô tả, đánh giá sản phẩm.', priority: TaskPriority.HIGH, position: 0 },
        { columnId: p1Doing.id, creatorId: user2.id, title: 'Làm chức năng tìm kiếm sản phẩm', description: 'Full-text search với Elasticsearch hoặc Algolia.', priority: TaskPriority.MEDIUM, position: 1 },
        { columnId: p1Doing.id, creatorId: user3.id, title: 'Xây dựng giỏ hàng (Cart)', description: 'Lưu giỏ hàng localStorage + sync với server.', priority: TaskPriority.HIGH, position: 2 },
        { columnId: p1Doing.id, creatorId: admin.id, title: 'Viết API quản lý kho', description: 'CRUD cho inventory, cảnh báo hết hàng.', priority: TaskPriority.MEDIUM, position: 3 },
        // Review (3 tasks)
        { columnId: p1Review.id, creatorId: user1.id, title: 'Review code authentication', description: 'Kiểm tra bảo mật JWT, refresh token.', priority: TaskPriority.CRITICAL, position: 0 },
        { columnId: p1Review.id, creatorId: user2.id, title: 'Test giao diện responsive', description: 'Kiểm tra UI trên mobile, tablet, desktop.', priority: TaskPriority.LOW, position: 1 },
        { columnId: p1Review.id, creatorId: user3.id, title: 'Kiểm tra hiệu năng API', description: 'Load test với k6 hoặc Artillery.', priority: TaskPriority.MEDIUM, position: 2 },
        // Done (3 tasks)
        { columnId: p1Done.id, creatorId: admin.id, title: 'Setup dự án NestJS + Prisma', description: 'Khởi tạo cấu trúc backend chuẩn.', priority: TaskPriority.CRITICAL, position: 0 },
        { columnId: p1Done.id, creatorId: user1.id, title: 'Thiết kế UI/UX Figma', description: 'Hoàn thành wireframe và mockup.', priority: TaskPriority.HIGH, position: 1 },
        { columnId: p1Done.id, creatorId: user2.id, title: 'Setup Next.js frontend', description: 'Cấu hình ESLint, Tailwind, folder structure.', priority: TaskPriority.MEDIUM, position: 2 },
    ];

    // ========== TASKS FOR PROJECT 2: HEALTH APP (12 tasks) ==========
    const [p2Idea, p2Design, p2Dev, p2Test, p2Done] = p2Cols;
    const p2Tasks = [
        // Ý tưởng
        { columnId: p2Idea.id, creatorId: user1.id, title: 'Nghiên cứu đối thủ cạnh tranh', description: 'Phân tích MyFitnessPal, Samsung Health, Apple Health.', priority: TaskPriority.LOW, position: 0 },
        { columnId: p2Idea.id, creatorId: admin.id, title: 'Khảo sát nhu cầu người dùng', description: 'Tạo Google Form thu thập ý kiến.', priority: TaskPriority.MEDIUM, position: 1 },
        // Thiết kế
        { columnId: p2Design.id, creatorId: user3.id, title: 'Thiết kế UI Dashboard', description: 'Giao diện tổng quan hiển thị các chỉ số.', priority: TaskPriority.HIGH, position: 0 },
        { columnId: p2Design.id, creatorId: user1.id, title: 'Thiết kế biểu đồ thống kê', description: 'Charts cho cân nặng, bước chân theo tuần/tháng.', priority: TaskPriority.MEDIUM, position: 1 },
        { columnId: p2Design.id, creatorId: user2.id, title: 'Thiết kế màn hình nhập liệu', description: 'Form nhập cân nặng, lượng nước uống.', priority: TaskPriority.LOW, position: 2 },
        // Phát triển
        { columnId: p2Dev.id, creatorId: admin.id, title: 'Xây dựng API backend', description: 'NestJS API cho CRUD health metrics.', priority: TaskPriority.CRITICAL, position: 0 },
        { columnId: p2Dev.id, creatorId: user3.id, title: 'Tích hợp Google Fit API', description: 'Đồng bộ bước chân từ Google Fit.', priority: TaskPriority.HIGH, position: 1 },
        { columnId: p2Dev.id, creatorId: user1.id, title: 'Làm chức năng reminder', description: 'Push notification nhắc uống nước.', priority: TaskPriority.MEDIUM, position: 2 },
        // Testing
        { columnId: p2Test.id, creatorId: user2.id, title: 'Test trên iOS simulator', description: 'Kiểm tra UI và chức năng trên iPhone.', priority: TaskPriority.HIGH, position: 0 },
        { columnId: p2Test.id, creatorId: user3.id, title: 'Test trên Android device', description: 'Kiểm tra trên Samsung, Xiaomi thực tế.', priority: TaskPriority.MEDIUM, position: 1 },
        // Hoàn thành
        { columnId: p2Done.id, creatorId: user1.id, title: 'Setup React Native project', description: 'Expo + TypeScript + Navigation.', priority: TaskPriority.CRITICAL, position: 0 },
        { columnId: p2Done.id, creatorId: admin.id, title: 'Cấu hình Firebase', description: 'Auth, Firestore, Push Notifications.', priority: TaskPriority.HIGH, position: 1 },
    ];

    // ========== TASKS FOR PROJECT 3: HRM (10 tasks) ==========
    const [p3Todo, p3Progress, p3Completed] = p3Cols;
    const p3Tasks = [
        // Chưa bắt đầu
        { columnId: p3Todo.id, creatorId: user2.id, title: 'Thiết kế bảng chấm công', description: 'Check-in/out, tính giờ làm thêm.', priority: TaskPriority.HIGH, position: 0 },
        { columnId: p3Todo.id, creatorId: user1.id, title: 'Module quản lý nghỉ phép', description: 'Đơn xin nghỉ, phê duyệt, số ngày còn lại.', priority: TaskPriority.MEDIUM, position: 1 },
        { columnId: p3Todo.id, creatorId: user3.id, title: 'Tích hợp máy chấm công vân tay', description: 'API kết nối với thiết bị ZKTeco.', priority: TaskPriority.LOW, position: 2 },
        { columnId: p3Todo.id, creatorId: admin.id, title: 'Báo cáo thống kê nhân sự', description: 'Dashboard tổng quan số lượng, phòng ban.', priority: TaskPriority.LOW, position: 3 },
        // Đang xử lý
        { columnId: p3Progress.id, creatorId: user2.id, title: 'Xây dựng module tính lương', description: 'Công thức lương, phụ cấp, khấu trừ.', priority: TaskPriority.CRITICAL, position: 0 },
        { columnId: p3Progress.id, creatorId: user1.id, title: 'Làm form đánh giá KPI', description: 'Tự đánh giá + quản lý đánh giá.', priority: TaskPriority.HIGH, position: 1 },
        { columnId: p3Progress.id, creatorId: user3.id, title: 'Quản lý hồ sơ nhân viên', description: 'CRUD thông tin cá nhân, hợp đồng.', priority: TaskPriority.MEDIUM, position: 2 },
        // Xong
        { columnId: p3Completed.id, creatorId: user2.id, title: 'Phân quyền theo phòng ban', description: 'RBAC cho HR, Manager, Employee.', priority: TaskPriority.CRITICAL, position: 0 },
        { columnId: p3Completed.id, creatorId: admin.id, title: 'Thiết kế database HRM', description: 'ERD cho employee, department, salary.', priority: TaskPriority.HIGH, position: 1 },
        { columnId: p3Completed.id, creatorId: user1.id, title: 'Setup dự án Angular', description: 'Angular 17 + Material UI + NgRx.', priority: TaskPriority.MEDIUM, position: 2 },
    ];

    // Create all tasks with task numbers
    let p1Counter = 0, p2Counter = 0, p3Counter = 0;

    for (const taskData of p1Tasks) {
        p1Counter++;
        await prisma.task.create({ data: { ...taskData, taskNumber: p1Counter } });
    }
    for (const taskData of p2Tasks) {
        p2Counter++;
        await prisma.task.create({ data: { ...taskData, taskNumber: p2Counter } });
    }
    for (const taskData of p3Tasks) {
        p3Counter++;
        await prisma.task.create({ data: { ...taskData, taskNumber: p3Counter } });
    }

    // Update project counters
    await prisma.project.update({ where: { id: project1.id }, data: { taskCounter: p1Counter } });
    await prisma.project.update({ where: { id: project2.id }, data: { taskCounter: p2Counter } });
    await prisma.project.update({ where: { id: project3.id }, data: { taskCounter: p3Counter } });

    console.log(`✅ Created ${p1Tasks.length + p2Tasks.length + p3Tasks.length} sample tasks across 3 projects`);

    // Create some activity logs for admin dashboard
    const logActions = ['USER_LOGIN', 'TASK_CREATED', 'TASK_UPDATED', 'PROJECT_CREATED'];
    const allUsers = [admin, user1, user2, user3];

    for (let i = 0; i < 15; i++) {
        await prisma.activityLog.create({
            data: {
                userId: allUsers[Math.floor(Math.random() * allUsers.length)].id,
                action: logActions[Math.floor(Math.random() * logActions.length)],
                projectId: i % 3 === 0 ? null : [project1.id, project2.id, project3.id][i % 3],
                details: { seed: true },
            },
        });
    }

    console.log('📝 Created sample activity logs');
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
