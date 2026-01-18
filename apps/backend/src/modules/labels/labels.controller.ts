import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LabelsService } from './labels.service';
import { CreateLabelDto, UpdateLabelDto, AddLabelToTaskDto, LabelResponseDto } from './dto';

@ApiTags('Labels')
@ApiBearerAuth()
@Controller('projects/:projectId/labels')
@UseGuards(JwtAuthGuard)
export class LabelsController {
    constructor(private labelsService: LabelsService) { }

    @ApiOperation({ summary: 'Tạo label mới cho project' })
    @ApiResponse({ status: 201, type: LabelResponseDto })
    @Post()
    async create(
        @Param('projectId') projectId: string,
        @Body() dto: CreateLabelDto,
        @Request() req: any,
    ) {
        return this.labelsService.create(projectId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'Lấy tất cả labels của project' })
    @ApiResponse({ status: 200, type: [LabelResponseDto] })
    @Get()
    async findAll(
        @Param('projectId') projectId: string,
        @Request() req: any,
    ) {
        return this.labelsService.findByProject(projectId, req.user.id);
    }

    @ApiOperation({ summary: 'Cập nhật label' })
    @Put(':labelId')
    async update(
        @Param('labelId') labelId: string,
        @Body() dto: UpdateLabelDto,
        @Request() req: any,
    ) {
        return this.labelsService.update(labelId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'Xóa label' })
    @Delete(':labelId')
    async delete(
        @Param('labelId') labelId: string,
        @Request() req: any,
    ) {
        return this.labelsService.delete(labelId, req.user.id);
    }
}

// Task Labels Controller (nested under tasks)
@ApiTags('Task Labels')
@ApiBearerAuth()
@Controller('tasks/:taskId/labels')
@UseGuards(JwtAuthGuard)
export class TaskLabelsController {
    constructor(private labelsService: LabelsService) { }

    @ApiOperation({ summary: 'Lấy labels của task' })
    @Get()
    async getTaskLabels(@Param('taskId') taskId: string) {
        return this.labelsService.getTaskLabels(taskId);
    }

    @ApiOperation({ summary: 'Thêm label vào task' })
    @Post()
    async addLabel(
        @Param('taskId') taskId: string,
        @Body() dto: AddLabelToTaskDto,
        @Request() req: any,
    ) {
        return this.labelsService.addToTask(taskId, dto.labelId, req.user.id);
    }

    @ApiOperation({ summary: 'Xóa label khỏi task' })
    @Delete(':labelId')
    async removeLabel(
        @Param('taskId') taskId: string,
        @Param('labelId') labelId: string,
        @Request() req: any,
    ) {
        return this.labelsService.removeFromTask(taskId, labelId, req.user.id);
    }
}
