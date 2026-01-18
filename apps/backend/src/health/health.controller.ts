import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('/api/health')
@Controller('health')
export class HealthController {
    constructor(private prisma: PrismaService) { }

    @ApiOperation({ summary: 'GET /api/health - Health check endpoint' })
    @Get()
    async check() {
        const startTime = Date.now();

        // Check database connection
        let databaseStatus = 'connected';
        try {
            await this.prisma.$queryRaw`SELECT 1`;
        } catch (error) {
            databaseStatus = 'disconnected';
        }

        return {
            status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            services: {
                database: databaseStatus,
            },
            responseTime: `${Date.now() - startTime}ms`,
        };
    }
}
