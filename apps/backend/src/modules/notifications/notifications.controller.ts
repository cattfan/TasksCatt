import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('/api/notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @ApiOperation({ summary: 'GET /api/notifications - Lấy danh sách thông báo' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @Get()
    async findAll(
        @Request() req: any,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.notificationsService.findByUser(
            req.user.id,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 20,
        );
    }

    @ApiOperation({ summary: 'GET /api/notifications/unread-count - Đếm thông báo chưa đọc' })
    @Get('unread-count')
    async getUnreadCount(@Request() req: any) {
        const count = await this.notificationsService.getUnreadCount(req.user.id);
        return { count };
    }

    @ApiOperation({ summary: 'PATCH /api/notifications/:id/read - Đánh dấu đã đọc' })
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Request() req: any) {
        await this.notificationsService.markAsRead(id, req.user.id);
        return { success: true };
    }

    @ApiOperation({ summary: 'PATCH /api/notifications/read-all - Đánh dấu tất cả đã đọc' })
    @Patch('read-all')
    async markAllAsRead(@Request() req: any) {
        await this.notificationsService.markAllAsRead(req.user.id);
        return { success: true };
    }
}
