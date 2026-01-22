import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SystemConfigService } from '../admin/system-config.service';

@ApiTags('system')
@Controller('system')
export class SystemController {
    constructor(private systemConfigService: SystemConfigService) { }

    @Get('status')
    @ApiOperation({ summary: 'Get public system status (maintenance mode, banner)' })
    async getStatus() {
        const [maintenanceMode, globalBanner] = await Promise.all([
            this.systemConfigService.getConfig('MAINTENANCE_MODE', 'false'),
            this.systemConfigService.getConfig('GLOBAL_BANNER', ''),
        ]);

        return {
            maintenance: maintenanceMode === 'true',
            banner: globalBanner || null,
        };
    }
}
