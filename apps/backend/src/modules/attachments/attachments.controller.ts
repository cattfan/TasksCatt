import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    Request,
    Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AttachmentsService } from './attachments.service';

@ApiTags('/api/attachments')
@ApiBearerAuth()
@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
    constructor(private attachmentsService: AttachmentsService) { }

    @ApiOperation({ summary: 'POST /api/attachments/upload - Upload file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                taskId: { type: 'string', nullable: true },
                commentId: { type: 'string', nullable: true },
            },
        },
    })
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async upload(
        @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
        @Request() req: any,
        @Query('taskId') taskId?: string,
        @Query('commentId') commentId?: string,
    ) {
        return this.attachmentsService.upload(file, req.user.id, taskId, commentId);
    }

    @ApiOperation({ summary: 'GET /api/attachments/:id - Lấy thông tin attachment' })
    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.attachmentsService.findById(id);
    }

    @ApiOperation({ summary: 'GET /api/attachments/task/:taskId - Lấy attachments của task' })
    @Get('task/:taskId')
    async findByTask(@Param('taskId') taskId: string) {
        return this.attachmentsService.findByTask(taskId);
    }

    @ApiOperation({ summary: 'GET /api/attachments/comment/:commentId - Lấy attachments của comment' })
    @Get('comment/:commentId')
    async findByComment(@Param('commentId') commentId: string) {
        return this.attachmentsService.findByComment(commentId);
    }

    @ApiOperation({ summary: 'DELETE /api/attachments/:id - Xóa attachment' })
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        return this.attachmentsService.delete(id, req.user.id);
    }
}
