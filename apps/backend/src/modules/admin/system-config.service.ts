import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SystemConfig } from '@prisma/client';

@Injectable()
export class SystemConfigService {
    constructor(private prisma: PrismaService) { }

    /**
     * Get a config value by key.
     * Returns default value if not found.
     */
    async getConfig(key: string, defaultValue: string = ''): Promise<string> {
        const config = await this.prisma.systemConfig.findUnique({
            where: { key },
        });
        return config ? config.value : defaultValue;
    }

    /**
     * Get all system configurations.
     */
    async getAllConfigs(): Promise<SystemConfig[]> {
        return this.prisma.systemConfig.findMany({
            orderBy: { key: 'asc' },
        });
    }

    /**
     * Set a config value.
     * Creates if not exists, updates if exists.
     */
    async setConfig(key: string, value: string, description?: string): Promise<SystemConfig> {
        return this.prisma.systemConfig.upsert({
            where: { key },
            update: {
                value,
                ...(description && { description }),
            },
            create: {
                key,
                value,
                description,
            },
        });
    }

    /**
     * Set multiple configs at once.
     */
    async setConfigs(configs: { key: string; value: string }[]): Promise<void> {
        await Promise.all(
            configs.map(config => this.setConfig(config.key, config.value))
        );
    }
}
