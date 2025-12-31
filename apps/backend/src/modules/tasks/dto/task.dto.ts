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
import { TaskPriority } from '@prisma/client';

// ==========================================
// Task DTOs
// ==========================================

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
    @MaxLength(255)
    title!: string;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    description?: string;

    @IsEnum(TaskPriority)
    @IsOptional()
    priority?: TaskPriority;

    @IsUUID()
    @IsNotEmpty()
    columnId!: string;

    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @IsOptional()
    @IsDateString()
    dueDate?: string;
}

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    @MaxLength(255)
    title?: string;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    description?: string;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsUUID()
    assigneeId?: string | null;

    @IsOptional()
    @IsDateString()
    dueDate?: string | null;
}

export class MoveTaskDto {
    @IsUUID()
    @IsNotEmpty()
    targetColumnId!: string;

    @IsInt()
    @Min(0)
    newPosition!: number;
}

export class ReorderTasksDto {
    @IsArray()
    @IsUUID('4', { each: true })
    taskIds!: string[];
}

// ==========================================
// Search/Filter DTOs (UC30, UC31)
// ==========================================

export class SearchTasksDto {
    @IsOptional()
    @IsString()
    q?: string; // Search query

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsUUID()
    assigneeId?: string;

    @IsOptional()
    @IsString()
    columnId?: string;

    @IsOptional()
    @IsString()
    dueBefore?: string; // ISO date

    @IsOptional()
    @IsString()
    dueAfter?: string; // ISO date
}
