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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, MoveTaskDto, ReorderTasksDto, SearchTasksDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('/api/tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
    constructor(private tasksService: TasksService) { }

    @ApiOperation({ summary: 'GET /api/tasks/my-tasks' })
    @Get('my-tasks')
    async getMyTasks(@Request() req: any) {
        return this.tasksService.getMyTasks(req.user.id);
    }

    @ApiOperation({ summary: 'GET /api/tasks/search/:projectId' })
    @Get('search/:projectId')
    async searchTasks(
        @Param('projectId') projectId: string,
        @Request() req: any,
        @Query() filters: SearchTasksDto,
    ) {
        return this.tasksService.searchTasks(projectId, req.user.id, filters);
    }

    @ApiOperation({ summary: 'POST /api/tasks' })
    @Post()
    async create(@Request() req: any, @Body() dto: CreateTaskDto) {
        return this.tasksService.create(req.user.id, dto);
    }

    @ApiOperation({ summary: 'GET /api/tasks/:id' })
    @Get(':id')
    async findById(@Param('id') id: string, @Request() req: any) {
        return this.tasksService.findById(id, req.user.id);
    }

    @ApiOperation({ summary: 'PATCH /api/tasks/:id' })
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.tasksService.update(id, req.user.id, dto);
    }

    @ApiOperation({ summary: 'DELETE /api/tasks/:id' })
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.tasksService.delete(id, req.user.id);
        return { message: 'Đã xóa task' };
    }

    @ApiOperation({ summary: 'POST /api/tasks/:id/move' })
    @Post(':id/move')
    async moveTask(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: MoveTaskDto,
    ) {
        return this.tasksService.moveTask(id, req.user.id, dto);
    }

    @ApiOperation({ summary: 'POST /api/tasks/column/:columnId/reorder' })
    @Post('column/:columnId/reorder')
    async reorderTasks(
        @Param('columnId') columnId: string,
        @Request() req: any,
        @Body() dto: ReorderTasksDto,
    ) {
        return this.tasksService.reorderTasks(columnId, req.user.id, dto);
    }
}
