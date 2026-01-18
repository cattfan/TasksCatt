import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength, MinLength } from 'class-validator';

export class CreateSubtaskDto {
    @ApiProperty({ example: 'Viết unit tests', description: 'Tiêu đề subtask' })
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;
}

export class UpdateSubtaskDto {
    @ApiProperty({ example: 'Viết unit tests cho service', required: false })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isCompleted?: boolean;
}

export class ReorderSubtasksDto {
    @ApiProperty({ example: ['id1', 'id2', 'id3'], description: 'Thứ tự mới của subtasks' })
    subtaskIds: string[];
}

export class SubtaskResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    taskId: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    isCompleted: boolean;

    @ApiProperty()
    position: number;

    @ApiProperty({ required: false })
    completedAt?: Date;

    @ApiProperty()
    createdAt: Date;
}
