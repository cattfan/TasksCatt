import {
    IsOptional,
    IsString,
    IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserAdminDto {
    @ApiPropertyOptional({ example: true, description: 'Khóa hoặc mở khóa người dùng' })
    @IsOptional()
    @IsBoolean()
    isBlocked?: boolean;

    @ApiPropertyOptional({ example: false, description: 'Cấp hoặc thu hồi quyền Admin' })
    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;

    @ApiPropertyOptional({ example: 'Sửa tên' })
    @IsOptional()
    @IsString()
    fullName?: string;
}

export class UserListQueryDto {
    @ApiPropertyOptional({ description: 'Tìm kiếm theo tên hoặc email' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Lọc danh sách bị khóa' })
    @IsOptional()
    @IsBoolean()
    isBlocked?: boolean;

    @ApiPropertyOptional({ description: 'Lọc danh sách admin' })
    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;
}
