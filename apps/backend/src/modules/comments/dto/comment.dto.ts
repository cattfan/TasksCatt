import {
    IsString,
    IsNotEmpty,
    IsUUID,
    MaxLength,
} from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @IsNotEmpty({ message: 'Nội dung không được để trống' })
    @MaxLength(5000, { message: 'Nội dung quá dài (tối đa 5000 ký tự)' })
    content!: string;

    @IsUUID()
    @IsNotEmpty()
    taskId!: string;
}

export class UpdateCommentDto {
    @IsString()
    @IsNotEmpty({ message: 'Nội dung không được để trống' })
    @MaxLength(5000)
    content!: string;
}
