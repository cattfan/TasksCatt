import {
    IsOptional,
    IsString,
    IsBoolean,
} from 'class-validator';

export class UpdateUserAdminDto {
    @IsOptional()
    @IsBoolean()
    isBlocked?: boolean;

    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;

    @IsOptional()
    @IsString()
    fullName?: string;
}

export class UserListQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsBoolean()
    isBlocked?: boolean;

    @IsOptional()
    @IsBoolean()
    isAdmin?: boolean;
}
