import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(private commentsService: CommentsService) { }

    /**
     * POST /api/comments
     * Tạo comment mới (UC27)
     */
    @Post()
    async create(@Request() req: any, @Body() dto: CreateCommentDto) {
        return this.commentsService.create(req.user.id, dto);
    }

    /**
     * GET /api/comments/task/:taskId
     * Lấy comments của task
     */
    @Get('task/:taskId')
    async findByTask(@Param('taskId') taskId: string, @Request() req: any) {
        return this.commentsService.findByTask(taskId, req.user.id);
    }

    /**
     * PATCH /api/comments/:id
     * Sửa comment (UC28)
     */
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateCommentDto,
    ) {
        return this.commentsService.update(id, req.user.id, dto);
    }

    /**
     * DELETE /api/comments/:id
     * Xóa comment (UC29)
     */
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.commentsService.delete(id, req.user.id);
        return { message: 'Đã xóa comment' };
    }
}
