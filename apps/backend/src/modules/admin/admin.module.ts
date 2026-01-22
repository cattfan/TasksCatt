import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ActivityLogService } from './activity-log.service';
import { SystemConfigService } from './system-config.service';

@Module({
    controllers: [AdminController],
    providers: [AdminService, ActivityLogService, SystemConfigService],
    exports: [AdminService, ActivityLogService, SystemConfigService],
})
export class AdminModule { }
