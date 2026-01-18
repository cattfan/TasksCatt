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
import { ProjectsService } from './projects.service';
import {
    CreateProjectDto,
    UpdateProjectDto,
    AddMemberDto,
    UpdateMemberRoleDto,
    CreateColumnDto,
    UpdateColumnDto,
    ReorderColumnsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('/api/projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(private projectsService: ProjectsService) { }

    // ==========================================
    // PROJECT ENDPOINTS
    // ==========================================

    @ApiOperation({ summary: 'POST /api/projects' })
    @Post()
    async create(@Request() req: any, @Body() dto: CreateProjectDto) {
        return this.projectsService.create(req.user.id, dto);
    }

    @ApiOperation({ summary: 'GET /api/projects' })
    @Get()
    async findAll(@Request() req: any) {
        return this.projectsService.findAllByUser(req.user.id);
    }

    @ApiOperation({ summary: 'GET /api/projects/:slug' })
    @Get(':slug')
    async findBySlug(@Param('slug') slug: string, @Request() req: any) {
        return this.projectsService.findBySlug(slug, req.user.id);
    }

    @ApiOperation({ summary: 'PATCH /api/projects/:id' })
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateProjectDto,
    ) {
        return this.projectsService.update(id, req.user.id, dto);
    }

    @ApiOperation({ summary: 'DELETE /api/projects/:id' })
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.projectsService.delete(id, req.user.id);
        return { message: 'Đã xóa project' };
    }

    // ==========================================
    // MEMBER ENDPOINTS
    // ==========================================

    @ApiOperation({ summary: 'POST /api/projects/:id/members' })
    @Post(':id/members')
    async addMember(
        @Param('id') projectId: string,
        @Request() req: any,
        @Body() dto: AddMemberDto,
    ) {
        return this.projectsService.addMember(projectId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'PATCH /api/projects/:id/members/:memberId' })
    @Patch(':id/members/:memberId')
    async updateMemberRole(
        @Param('id') projectId: string,
        @Param('memberId') memberId: string,
        @Request() req: any,
        @Body() dto: UpdateMemberRoleDto,
    ) {
        return this.projectsService.updateMemberRole(projectId, memberId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'DELETE /api/projects/:id/members/:memberId' })
    @Delete(':id/members/:memberId')
    async removeMember(
        @Param('id') projectId: string,
        @Param('memberId') memberId: string,
        @Request() req: any,
    ) {
        await this.projectsService.removeMember(projectId, memberId, req.user.id);
        return { message: 'Đã xóa thành viên' };
    }

    // ==========================================
    // COLUMN ENDPOINTS
    // ==========================================

    @ApiOperation({ summary: 'POST /api/projects/:id/columns' })
    @Post(':id/columns')
    async addColumn(
        @Param('id') projectId: string,
        @Request() req: any,
        @Body() dto: CreateColumnDto,
    ) {
        return this.projectsService.addColumn(projectId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'PATCH /api/projects/:id/columns/:columnId' })
    @Patch(':id/columns/:columnId')
    async updateColumn(
        @Param('id') projectId: string,
        @Param('columnId') columnId: string,
        @Request() req: any,
        @Body() dto: UpdateColumnDto,
    ) {
        return this.projectsService.updateColumn(projectId, columnId, req.user.id, dto);
    }

    @ApiOperation({ summary: 'DELETE /api/projects/:id/columns/:columnId' })
    @Delete(':id/columns/:columnId')
    async deleteColumn(
        @Param('id') projectId: string,
        @Param('columnId') columnId: string,
        @Request() req: any,
    ) {
        await this.projectsService.deleteColumn(projectId, columnId, req.user.id);
        return { message: 'Đã xóa cột' };
    }

    @ApiOperation({ summary: 'POST /api/projects/:id/columns/reorder' })
    @Post(':id/columns/reorder')
    async reorderColumns(
        @Param('id') projectId: string,
        @Request() req: any,
        @Body() dto: ReorderColumnsDto,
    ) {
        return this.projectsService.reorderColumns(projectId, req.user.id, dto);
    }

    // ==========================================
    // PROGRESS REPORT
    // ==========================================

    @ApiOperation({ summary: 'GET /api/projects/:id/progress - Báo cáo tiến độ dự án' })
    @Get(':id/progress')
    async getProgress(@Param('id') projectId: string, @Request() req: any) {
        return this.projectsService.getProgress(projectId, req.user.id);
    }
}

