import { IsOptional, IsString, MaxLength } from 'class-validator';
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
}

export class UserResponseDto {
    id!: string;
    email!: string;
    fullName!: string;
    avatarUrl!: string | null;
    createdAt!: Date;
}
