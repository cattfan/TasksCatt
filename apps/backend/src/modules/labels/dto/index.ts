import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsHexColor, MaxLength, MinLength } from 'class-validator';

export class CreateLabelDto {
    @ApiProperty({ example: 'Bug', description: 'Tên label' })
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name: string;

    @ApiProperty({ example: '#EF4444', description: 'Màu label (hex)', required: false })
    @IsOptional()
    @IsHexColor()
    color?: string;
}

export class UpdateLabelDto {
    @ApiProperty({ example: 'Bug Fixed', required: false })
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(50)
    name?: string;

    @ApiProperty({ example: '#22C55E', required: false })
    @IsOptional()
    @IsHexColor()
    color?: string;
}

export class LabelResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    projectId: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    color: string;

    @ApiProperty()
    createdAt: Date;
}

export class AddLabelToTaskDto {
    @ApiProperty({ example: 'label-uuid', description: 'ID của label' })
    @IsString()
    labelId: string;
}
