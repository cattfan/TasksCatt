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
import { SubtasksService } from './subtasks.service';
import { CreateSubtaskDto, UpdateSubtaskDto, ReorderSubtasksDto, SubtaskResponseDto } from './dto';

@ApiTags('Subtasks')
@ApiBearerAuth()
@Controller('tasks/:taskId/subtasks')
@UseGuards(JwtAuthGuard)
export class SubtasksController {
    constructor(private subtasksService: SubtasksService) { }

    @ApiOperation({ summary: 'Tạo subtask mới' })
    @ApiResponse({ status: 201, type: SubtaskResponseDto })
    @Post()
    async create(
        @Param('taskId') taskId: string,
        @Body() dto: CreateSubtaskDto,
        @Request() req: any,
    ) {
        return this.subtasksService.create(taskId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'Lấy tất cả subtasks của task' })
    @ApiResponse({ status: 200, type: [SubtaskResponseDto] })
    @Get()
    async findAll(@Param('taskId') taskId: string) {
        return this.subtasksService.findByTask(taskId);
    }

    @ApiOperation({ summary: 'Lấy progress của task' })
    @Get('progress')
    async getProgress(@Param('taskId') taskId: string) {
        return this.subtasksService.getProgress(taskId);
    }

    @ApiOperation({ summary: 'Cập nhật subtask' })
    @Put(':subtaskId')
    async update(
        @Param('subtaskId') subtaskId: string,
        @Body() dto: UpdateSubtaskDto,
        @Request() req: any,
    ) {
        return this.subtasksService.update(subtaskId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'Toggle hoàn thành subtask' })
    @Put(':subtaskId/toggle')
    async toggle(
        @Param('subtaskId') subtaskId: string,
        @Request() req: any,
    ) {
        return this.subtasksService.toggle(subtaskId, req.user.id);
    }

    @ApiOperation({ summary: 'Xóa subtask' })
    @Delete(':subtaskId')
    async delete(
        @Param('subtaskId') subtaskId: string,
        @Request() req: any,
    ) {
        return this.subtasksService.delete(subtaskId, req.user.id);
    }

    @ApiOperation({ summary: 'Sắp xếp lại subtasks' })
    @Put()
    async reorder(
        @Param('taskId') taskId: string,
        @Body() dto: ReorderSubtasksDto,
        @Request() req: any,
    ) {
        return this.subtasksService.reorder(taskId, req.user.id, dto.subtaskIds);
    }
}
