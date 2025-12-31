import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';

@Global()
@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'taskscatt-secret',
            }),
        }),
    ],
    providers: [EventsGateway],
    exports: [EventsGateway],
})
export class GatewayModule { }
