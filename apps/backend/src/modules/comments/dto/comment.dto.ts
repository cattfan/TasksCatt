import {
    IsString,
    IsNotEmpty,
    IsUUID,
    MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
    @ApiProperty({ example: 'This is a comment...', description: 'Nội dung bình luận' })
    @IsString()
    @IsNotEmpty({ message: 'Nội dung không được để trống' })
    @MaxLength(5000, { message: 'Nội dung quá dài (tối đa 5000 ký tự)' })
    content!: string;

    @ApiProperty({ example: 'uuid-of-task', description: 'ID của task' })
    @IsUUID()
    @IsNotEmpty()
    taskId!: string;
}

export class UpdateCommentDto {
    @ApiProperty({ example: 'Updated comment content...' })
    @IsString()
    @IsNotEmpty({ message: 'Nội dung không được để trống' })
    @MaxLength(5000)
    content!: string;
}
