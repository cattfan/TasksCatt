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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateUserAdminDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('/api/admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(private adminService: AdminService) { }

    @ApiOperation({ summary: 'GET /api/admin/stats' })
    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    @ApiOperation({ summary: 'GET /api/admin/users' })
    @Get('users')
    async findAllUsers(@Query('search') search?: string) {
        return this.adminService.findAllUsers(search);
    }

    @ApiOperation({ summary: 'GET /api/admin/users/:id' })
    @Get('users/:id')
    async findUserById(@Param('id') id: string) {
        return this.adminService.findUserById(id);
    }

    @ApiOperation({ summary: 'PATCH /api/admin/users/:id' })
    @Patch('users/:id')
    async updateUser(
        @Param('id') id: string,
        @Body() dto: UpdateUserAdminDto,
        @Request() req: any,
    ) {
        return this.adminService.updateUser(id, dto, req.user.id);
    }

    @ApiOperation({ summary: 'POST /api/admin/users/:id/block' })
    @Post('users/:id/block')
    async blockUser(@Param('id') id: string, @Request() req: any) {
        return this.adminService.blockUser(id, req.user.id);
    }

    @ApiOperation({ summary: 'POST /api/admin/users/:id/unblock' })
    @Post('users/:id/unblock')
    async unblockUser(@Param('id') id: string, @Request() req: any) {
        return this.adminService.unblockUser(id, req.user.id);
    }
}
