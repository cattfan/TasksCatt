import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validationSchema } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AdminModule } from './modules/admin/admin.module';
import { ActivityModule } from './modules/activity/activity.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { LabelsModule } from './modules/labels/labels.module';
import { SubtasksModule } from './modules/subtasks/subtasks.module';
import { MailModule } from './modules/mail/mail.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
    imports: [
        // Configuration with validation
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
            validationSchema,
        }),

        // Rate limiting - 10 requests per 60 seconds for login
        ThrottlerModule.forRoot([{
            ttl: 60000,  // 1 minute
            limit: 60,   // 60 requests per minute globally
        }]),

        // Core modules
        PrismaModule,
        GatewayModule,
        HealthModule,

        // Feature modules
        AuthModule,
        UsersModule,
        ProjectsModule,
        TasksModule,
        CommentsModule,
        AdminModule,
        ActivityModule,
        AttachmentsModule,
        LabelsModule,
        SubtasksModule,
        MailModule,
    ],
    controllers: [],
    providers: [
        // Global rate limiting guard
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }
