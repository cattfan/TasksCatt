import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiPropertyOptional({ example: 'Nguyen Van B', description: 'Cập nhật họ tên' })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    fullName?: string;

    @ApiPropertyOptional({ example: 'https://cdn.com/avatar.png', description: 'Cập nhật URL ảnh đại diện' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    avatarUrl?: string;

    @ApiPropertyOptional({ description: 'Cập nhật cài đặt nhận email khi được nhắc đến' })
    @IsOptional()
    @IsBoolean()
    emailNotifications?: boolean;

    @ApiPropertyOptional({ description: 'Cập nhật cài đặt nhận thông báo khi task thay đổi' })
    @IsOptional()
    @IsBoolean()
    taskUpdateNotifications?: boolean;

    @ApiPropertyOptional({ description: 'Cập nhật cài đặt nhận thông báo khi có phản hồi bình luận' })
    @IsOptional()
    @IsBoolean()
    commentReplyNotifications?: boolean;

    @ApiPropertyOptional({ description: 'Cập nhật cài đặt nhận thông báo khi được mời vào dự án' })
    @IsOptional()
    @IsBoolean()
    projectInviteNotifications?: boolean;
}

export class UserResponseDto {
    id!: string;
    email!: string;
    fullName!: string;
    avatarUrl!: string | null;
    createdAt!: Date;
    emailNotifications!: boolean;
    taskUpdateNotifications!: boolean;
    commentReplyNotifications!: boolean;
    projectInviteNotifications!: boolean;
}
