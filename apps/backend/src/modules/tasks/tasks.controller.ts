import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, ReorderTasksDto, SearchTasksDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
    constructor(private tasksService: TasksService) { }

    /**
     * GET /api/tasks/search/:projectId (UC30, UC31)
     * Tìm kiếm và lọc tasks trong project
     */
    @Get('search/:projectId')
    async searchTasks(
        @Param('projectId') projectId: string,
        @Request() req: any,
        @Query() filters: SearchTasksDto,
    ) {
        return this.tasksService.searchTasks(projectId, req.user.id, filters);
    }

    /**
     * POST /api/tasks
     * Tạo task mới
     */
    @Post()
    async create(@Request() req: any, @Body() dto: CreateTaskDto) {
        return this.tasksService.create(req.user.id, dto);
    }

    /**
     * GET /api/tasks/:id
     * Lấy chi tiết task
     */
    @Get(':id')
    async findById(@Param('id') id: string, @Request() req: any) {
        return this.tasksService.findById(id, req.user.id);
    }

    /**
     * PATCH /api/tasks/:id
     * Cập nhật task
     */
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.tasksService.update(id, req.user.id, dto);
    }

    /**
     * DELETE /api/tasks/:id
     * Xóa task
     */
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.tasksService.delete(id, req.user.id);
        return { message: 'Đã xóa task' };
    }

    /**
     * POST /api/tasks/:id/move
     * Di chuyển task sang column/position khác
     */
    @Post(':id/move')
    async moveTask(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: MoveTaskDto,
    ) {
        return this.tasksService.moveTask(id, req.user.id, dto);
    }

    /**
     * POST /api/tasks/column/:columnId/reorder
     * Reorder tasks trong một column
     */
    @Post('column/:columnId/reorder')
    async reorderTasks(
        @Param('columnId') columnId: string,
        @Request() req: any,
        @Body() dto: ReorderTasksDto,
    ) {
        return this.tasksService.reorderTasks(columnId, req.user.id, dto);
    }
}
