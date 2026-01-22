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
    Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { ActivityLogService } from './activity-log.service';
import { SystemConfigService } from './system-config.service';
import { UpdateUserAdminDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('/api/admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
    constructor(
        private adminService: AdminService,
        private activityLogService: ActivityLogService,
        private systemConfigService: SystemConfigService,
    ) { }

    @ApiOperation({ summary: 'GET /api/admin/stats' })
    @Get('stats')
    async getStats() {
        return this.adminService.getStats();
    }

    @ApiOperation({ summary: 'GET /api/admin/projects - Danh sách dự án' })
    @Get('projects')
    async getAllProjects() {
        return this.adminService.getAllProjects();
    }

    @ApiOperation({ summary: 'GET /api/admin/logs - Activity logs toàn hệ thống' })
    @Get('logs')
    async getAllLogs(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.activityLogService.getAllLogs(
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0,
        );
    }

    @ApiOperation({ summary: 'GET /api/admin/logs/system - Logs hệ thống' })
    @Get('logs/system')
    async getSystemLogs(
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.activityLogService.getSystemLogs(
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0,
        );
    }

    @ApiOperation({ summary: 'GET /api/admin/logs/project/:id - Logs theo dự án' })
    @Get('logs/project/:id')
    async getProjectLogs(
        @Param('id') projectId: string,
        @Query('limit') limit?: string,
        @Query('offset') offset?: string,
    ) {
        return this.activityLogService.getProjectLogs(
            projectId,
            limit ? parseInt(limit) : 50,
            offset ? parseInt(offset) : 0,
        );
    }

    @ApiOperation({ summary: 'GET /api/admin/logs/stats - Thống kê activity' })
    @Get('logs/stats')
    async getActivityStats() {
        return this.activityLogService.getActivityStats();
    }

    @ApiOperation({ summary: 'GET /api/admin/system-config' })
    @Get('system-config')
    async getSystemConfig() {
        return this.systemConfigService.getAllConfigs();
    }

    @ApiOperation({ summary: 'PATCH /api/admin/system-config' })
    @Patch('system-config')
    async updateSystemConfig(@Body() configs: { key: string; value: string }[]) {
        return this.systemConfigService.setConfigs(configs);
    }

    @ApiOperation({ summary: 'GET /api/admin/chart-data' })
    @Get('chart-data')
    async getChartData() {
        return this.adminService.getChartData();
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

    @ApiOperation({ summary: 'GET /api/admin/export/users' })
    @Get('export/users')
    @Header('Content-Type', 'text/csv')
    @Header('Content-Disposition', 'attachment; filename=users.csv')
    async exportUsers() {
        return this.adminService.exportUsers();
    }

    @ApiOperation({ summary: 'GET /api/admin/export/logs' })
    @Get('export/logs')
    @Header('Content-Type', 'text/csv')
    @Header('Content-Disposition', 'attachment; filename=activity_logs.csv')
    async exportLogs() {
        return this.adminService.exportLogs();
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

