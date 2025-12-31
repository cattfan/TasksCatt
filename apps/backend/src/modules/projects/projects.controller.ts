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

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(private projectsService: ProjectsService) { }

    // ==========================================
    // PROJECT ENDPOINTS
    // ==========================================

    /**
     * POST /api/projects
     * Tạo project mới
     */
    @Post()
    async create(@Request() req: any, @Body() dto: CreateProjectDto) {
        return this.projectsService.create(req.user.id, dto);
    }

    /**
     * GET /api/projects
     * Lấy danh sách projects của user
     */
    @Get()
    async findAll(@Request() req: any) {
        return this.projectsService.findAllByUser(req.user.id);
    }

    /**
     * GET /api/projects/:slug
     * Lấy chi tiết project theo slug
     */
    @Get(':slug')
    async findBySlug(@Param('slug') slug: string, @Request() req: any) {
        return this.projectsService.findBySlug(slug, req.user.id);
    }

    /**
     * PATCH /api/projects/:id
     * Cập nhật project
     */
    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateProjectDto,
    ) {
        return this.projectsService.update(id, req.user.id, dto);
    }

    /**
     * DELETE /api/projects/:id
     * Xóa project
     */
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req: any) {
        await this.projectsService.delete(id, req.user.id);
        return { message: 'Đã xóa project' };
    }

    // ==========================================
    // MEMBER ENDPOINTS
    // ==========================================

    /**
     * POST /api/projects/:id/members
     * Thêm member vào project
     */
    @Post(':id/members')
    async addMember(
        @Param('id') projectId: string,
        @Request() req: any,
        @Body() dto: AddMemberDto,
    ) {
        return this.projectsService.addMember(projectId, req.user.id, dto);
    }

    /**
     * PATCH /api/projects/:id/members/:memberId
     * Cập nhật role của member
     */
    @Patch(':id/members/:memberId')
    async updateMemberRole(
        @Param('id') projectId: string,
        @Param('memberId') memberId: string,
        @Request() req: any,
        @Body() dto: UpdateMemberRoleDto,
    ) {
        return this.projectsService.updateMemberRole(projectId, memberId, req.user.id, dto);
    }

    /**
     * DELETE /api/projects/:id/members/:memberId
     * Xóa member khỏi project
     */
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

    /**
     * POST /api/projects/:id/columns
     * Thêm column mới
     */
    @Post(':id/columns')
    async addColumn(
        @Param('id') projectId: string,
        @Request() req: any,
        @Body() dto: CreateColumnDto,
    ) {
        return this.projectsService.addColumn(projectId, req.user.id, dto);
    }

    /**
     * PATCH /api/projects/:id/columns/:columnId
     * Cập nhật column
     */
    @Patch(':id/columns/:columnId')
    async updateColumn(
        @Param('id') projectId: string,
        @Param('columnId') columnId: string,
        @Request() req: any,
        @Body() dto: UpdateColumnDto,
    ) {
        return this.projectsService.updateColumn(projectId, columnId, req.user.id, dto);
    }

    /**
     * DELETE /api/projects/:id/columns/:columnId
     * Xóa column
     */
    @Delete(':id/columns/:columnId')
    async deleteColumn(
        @Param('id') projectId: string,
        @Param('columnId') columnId: string,
        @Request() req: any,
    ) {
        await this.projectsService.deleteColumn(projectId, columnId, req.user.id);
        return { message: 'Đã xóa cột' };
    }

    /**
     * POST /api/projects/:id/columns/reorder
     * Sắp xếp lại columns
     */
    @Post(':id/columns/reorder')
    async reorderColumns(
        @Param('id') projectId: string,
        @Request() req: any,
        @Body() dto: ReorderColumnsDto,
    ) {
        return this.projectsService.reorderColumns(projectId, req.user.id, dto);
    }
}
