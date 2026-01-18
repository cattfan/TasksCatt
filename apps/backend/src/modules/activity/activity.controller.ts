import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('/api/activity')
@ApiBearerAuth()
@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
    constructor(private activityService: ActivityService) { }

    @ApiOperation({ summary: 'GET /api/activity/project/:projectId' })
    @Get('project/:projectId')
    async getByProject(
        @Param('projectId') projectId: string,
        @Query('limit') limit?: string,
    ) {
        return this.activityService.getByProject(projectId, limit ? parseInt(limit) : 50);
    }

    @ApiOperation({ summary: 'GET /api/activity/me' })
    @Get('me')
    async getMyActivity(@Request() req: any, @Query('limit') limit?: string) {
        return this.activityService.getByUser(req.user.id, limit ? parseInt(limit) : 50);
    }
}
