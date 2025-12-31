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
import { MemberRole } from '@prisma/client';

// ==========================================
// Project DTOs
// ==========================================

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên dự án không được để trống' })
    @MinLength(3, { message: 'Tên dự án phải có ít nhất 3 ký tự' })
    @MaxLength(100, { message: 'Tên dự án quá dài' })
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    @Matches(/^[a-z0-9-]+$/, { message: 'Slug chỉ chứa chữ thường, số và dấu gạch ngang' })
    slug?: string;
}

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    @MinLength(3)
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;
}

// ==========================================
// Member DTOs
// ==========================================

export class AddMemberDto {
    @IsString()
    @IsNotEmpty()
    email!: string;

    @IsEnum(MemberRole)
    role!: MemberRole;
}

export class UpdateMemberRoleDto {
    @IsEnum(MemberRole)
    role!: MemberRole;
}

// ==========================================
// Column DTOs
// ==========================================

export class CreateColumnDto {
    @IsString()
    @IsNotEmpty({ message: 'Tên cột không được để trống' })
    @MaxLength(50)
    name!: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Màu phải là mã hex hợp lệ' })
    color?: string;
}

export class UpdateColumnDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#[0-9A-Fa-f]{6}$/)
    color?: string;
}

export class ReorderColumnsDto {
    @IsArray()
    @IsString({ each: true })
    columnIds!: string[];
}
