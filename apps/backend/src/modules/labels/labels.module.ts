import { Module } from '@nestjs/common';
import { LabelsController, TaskLabelsController } from './labels.controller';
import { LabelsService } from './labels.service';

@Module({
    controllers: [LabelsController, TaskLabelsController],
    providers: [LabelsService],
    exports: [LabelsService],
})
export class LabelsModule { }
