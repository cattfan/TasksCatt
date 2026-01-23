import {
    IsString,
    IsNotEmpty,
    IsOptional,
    MaxLength,
    MinLength,
    Matches,
    IsEnum,
    IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberRole } from '@prisma/client';

// ==========================================
// Project DTOs
// ==========================================

export class CreateProjectDto {
    @ApiProperty({ example: 'My New Project', description: 'Tên dự án' })
    @IsString()
    @IsNotEmpty({ message: 'Tên dự án không được để trống' })
    @MinLength(3, { message: 'Tên dự án phải có ít nhất 3 ký tự' })
    @MaxLength(100, { message: 'Tên dự án quá dài' })
    name!: string;

    @ApiPropertyOptional({ example: 'Mô tả chi tiết về dự án...', description: 'Mô tả dự án' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({ example: 'my-project-slug', description: 'Đường dẫn định danh duy nhất (Slug)' })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    @Matches(/^[a-z0-9-]+$/, { message: 'Slug chỉ chứa chữ thường, số và dấu gạch ngang' })
    slug?: string;

    @ApiPropertyOptional({ example: 'ECOM', description: 'Tiền tố cho mã công việc (VD: ECOM-1, ECOM-2)' })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(10)
    @Matches(/^[A-Z0-9-]+$/, { message: 'Prefix chỉ chứa chữ in hoa, số và dấu gạch ngang' })
    prefix?: string;
}

export class UpdateProjectDto {
    @ApiPropertyOptional({ example: 'Updated Project Name' })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({ example: 'Updated description...' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}

// ==========================================
// Member DTOs
// ==========================================

export class AddMemberDto {
    @ApiProperty({ example: 'member@example.com', description: 'Email của thành viên muốn thêm' })
    @IsString()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ enum: MemberRole, default: MemberRole.MEMBER, description: 'Vai trò của thành viên' })
    @IsEnum(MemberRole)
    role!: MemberRole;
}

export class UpdateMemberRoleDto {
    @ApiProperty({ enum: MemberRole, description: 'Vai trò mới của thành viên' })
    @IsEnum(MemberRole)
    role!: MemberRole;
}

// ==========================================
// Column DTOs
// ==========================================

export class CreateColumnDto {
    @ApiProperty({ example: 'To Do', description: 'Tên cột' })
    @IsString()
    @IsNotEmpty({ message: 'Tên cột không được để trống' })
    @MaxLength(50)
    name!: string;

    @ApiPropertyOptional({ example: '#3498db', description: 'Mã màu của cột (Hex)' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Màu phải là mã hex hợp lệ' })
    color?: string;
}

export class UpdateColumnDto {
    @ApiPropertyOptional({ example: 'In Progress' })
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @ApiPropertyOptional({ example: '#e67e22' })
    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    color?: string;
}

export class ReorderColumnsDto {
    @ApiProperty({ type: [String], description: 'Danh sách ID các cột theo thứ tự mới' })
    @IsArray()
    @IsString({ each: true })
    columnIds!: string[];
}
