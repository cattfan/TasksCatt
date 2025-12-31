import {
    Controller,
    Get,
    Patch,
    Post,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserAdminDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    /**
     * GET /api/admin/stats
     * Thống kê hệ thống
     */
    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    /**
     * GET /api/admin/users
     * Danh sách tất cả users (UC34)
     */
    @Get('users')
    async findAllUsers(@Query('search') search?: string) {
        return this.adminService.findAllUsers(search);
    }

    /**
     * GET /api/admin/users/:id
     * Chi tiết user
     */
    @Get('users/:id')
    async findUserById(@Param('id') id: string) {
        return this.adminService.findUserById(id);
    }

    /**
     * PATCH /api/admin/users/:id
     * Cập nhật user
     */
    @Patch('users/:id')
    async updateUser(
        @Param('id') id: string,
        @Body() dto: UpdateUserAdminDto,
        @Request() req: any,
    ) {
        return this.adminService.updateUser(id, dto, req.user.id);
    }

    /**
     * POST /api/admin/users/:id/block
     * Block user (UC35)
     */
    @Post('users/:id/block')
    async blockUser(@Param('id') id: string, @Request() req: any) {
        return this.adminService.blockUser(id, req.user.id);
    }

    /**
     * POST /api/admin/users/:id/unblock
     * Unblock user (UC35)
     */
    @Post('users/:id/unblock')
    async unblockUser(@Param('id') id: string, @Request() req: any) {
        return this.adminService.unblockUser(id, req.user.id);
    }
}
