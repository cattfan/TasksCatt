import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
    constructor(private activityService: ActivityService) { }

    /**
     * GET /api/activity/project/:projectId
     * Lấy activity log của project (UC33)
     */
    @Get('project/:projectId')
    async getByProject(
        @Param('projectId') projectId: string,
        @Query('limit') limit?: string,
    ) {
        return this.activityService.getByProject(projectId, limit ? parseInt(limit) : 50);
    }

    /**
     * GET /api/activity/me
     * Lấy activity log của user hiện tại
     */
    @Get('me')
    async getMyActivity(@Request() req: any, @Query('limit') limit?: string) {
        return this.activityService.getByUser(req.user.id, limit ? parseInt(limit) : 50);
    }
}
