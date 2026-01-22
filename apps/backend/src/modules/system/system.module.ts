import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
    imports: [AdminModule], // For SystemConfigService
    controllers: [SystemController],
})
export class SystemModule { }
