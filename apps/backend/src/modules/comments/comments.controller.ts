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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('/api/comments')
@ApiBearerAuth()
@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
    constructor(private commentsService: CommentsService) { }

    @ApiOperation({ summary: 'POST /api/comments' })
    @Post()
    async create(@Request() req: any, @Body() dto: CreateCommentDto) {
        return this.commentsService.create(req.user.id, dto);
    }

    @ApiOperation({ summary: 'GET /api/comments/task/:taskId' })
    @Get('task/:taskId')
    async findByTask(@Param('taskId') taskId: string, @Request() req: any) {
        return this.commentsService.findByTask(taskId, req.user.id);
    }

    @ApiOperation({ summary: 'PATCH /api/comments/:id' })
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateCommentDto,
    ) {
        return this.commentsService.update(id, req.user.id, dto);
    }

    @ApiOperation({ summary: 'DELETE /api/comments/:id' })
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.commentsService.delete(id, req.user.id);
        return { message: 'Đã xóa comment' };
    }
}
