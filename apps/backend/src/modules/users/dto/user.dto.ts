import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    fullName?: string;

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
