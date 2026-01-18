import {
    IsString,
    IsNotEmpty,
    IsOptional,
    MaxLength,
    IsEnum,
    IsUUID,
    IsDateString,
    IsInt,
    Min,
    IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority } from '@prisma/client';

// ==========================================
// Task DTOs
// ==========================================

export class CreateTaskDto {
    @ApiProperty({ example: 'Implement Authentication', description: 'Tiêu đề công việc' })
    @IsString()
    @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
    @MaxLength(255)
    title!: string;

    @ApiPropertyOptional({ example: 'Sử dụng Passport JWT...', description: 'Mô tả chi tiết' })
    @IsOptional()
    @IsString()
    @MaxLength(10000)
    description?: string;

    @ApiPropertyOptional({ enum: TaskPriority, default: TaskPriority.MEDIUM, description: 'Mức độ ưu tiên' })
    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @ApiProperty({ example: 'uuid-of-column', description: 'ID của cột chứa task' })
    @IsUUID()
    @IsNotEmpty()
    columnId!: string;

    @ApiPropertyOptional({ example: ['uuid-of-user'], description: 'Danh sách ID người được giao việc' })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    assigneeIds?: string[];

    @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z', description: 'Ngày hết hạn (ISO Date)' })
    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

export class UpdateTaskDto {
    @ApiPropertyOptional({ example: 'Updated Title' })
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @ApiPropertyOptional({ example: 'Updated description...' })
    @IsOptional()
    @IsString()
    @MaxLength(10000)
    description?: string;

    @ApiPropertyOptional({ enum: TaskPriority })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ example: ['uuid-of-user'] })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    assigneeIds?: string[];

    @ApiPropertyOptional({ example: '2024-12-31T23:59:59Z or null' })
    @IsOptional()
    @IsDateString()
    dueDate?: string | null;
}

export class MoveTaskDto {
    @ApiProperty({ example: 'uuid-of-target-column', description: 'ID của cột đích' })
    @IsUUID()
    @IsNotEmpty()
    targetColumnId!: string;

    @ApiProperty({ example: 0, description: 'Vị trí mới trong cột (bắt đầu từ 0)' })
    @IsInt()
    @Min(0)
    newPosition!: number;
}

export class ReorderTasksDto {
    @ApiProperty({ type: [String], description: 'Danh sách ID các task theo thứ tự mới' })
    @IsArray()
    @IsUUID('4', { each: true })
    taskIds!: string[];
}

// ==========================================
// Search/Filter DTOs (UC30, UC31)
// ==========================================

export class SearchTasksDto {
    @ApiPropertyOptional({ example: 'auth', description: 'Từ khóa tìm kiếm (tiêu đề hoặc mô tả)' })
    @IsOptional()
    @IsString()
    q?: string; // Search query

    @ApiPropertyOptional({ enum: TaskPriority, description: 'Lọc theo mức độ ưu tiên' })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @ApiPropertyOptional({ example: 'uuid-of-user', description: 'Lọc theo người được giao' })
    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @ApiPropertyOptional({ example: 'uuid-of-column', description: 'Lọc theo cột' })
    @IsOptional()
    @IsString()
    columnId?: string;

    @ApiPropertyOptional({ example: '2024-12-31', description: 'Hạn cuối trước ngày...' })
    @IsOptional()
    @IsString()
    dueBefore?: string; // ISO date

    @ApiPropertyOptional({ example: '2024-01-01', description: 'Hạn cuối sau ngày...' })
    @IsOptional()
    @IsString()
    dueAfter?: string; // ISO date
}
