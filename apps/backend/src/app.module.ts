import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AdminModule } from './modules/admin/admin.module';
import { ActivityModule } from './modules/activity/activity.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '../../.env',
        }),
        PrismaModule,
        GatewayModule,
        AuthModule,
        UsersModule,
        ProjectsModule,
        TasksModule,
        CommentsModule,
        AdminModule,
        ActivityModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
