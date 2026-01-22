import { IsEnum, IsOptional, IsString, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, Prisma } from '@prisma/client';

export class CreateNotificationDto {
    @ApiProperty({ enum: NotificationType })
    @IsEnum(NotificationType)
    type!: NotificationType;

    @ApiProperty()
    @IsString()
    title!: string;

    @ApiProperty()
    @IsString()
    message!: string;

    @ApiProperty()
    @IsUUID()
    userId!: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsObject()
    data?: Prisma.InputJsonValue;
}

export class NotificationResponseDto {
    id!: string;
    type!: NotificationType;
    title!: string;
    message!: string;
    data!: Record<string, unknown> | null;
    isRead!: boolean;
    createdAt!: Date;
}
