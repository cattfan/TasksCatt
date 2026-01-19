import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'Địa chỉ email' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email!: string;

    @ApiProperty({ example: 'password123', description: 'Mật khẩu', minLength: 8 })
    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    password!: string;

    @ApiProperty({ example: 'Nguyen Van A', description: 'Họ và tên' })
    @IsString()
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @MaxLength(100, { message: 'Họ tên quá dài' })
    fullName!: string;
}

export class LoginDto {
    @ApiProperty({ example: 'demo@gmail.com', description: 'Địa chỉ email' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email!: string;

    @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    password!: string;
}

export class ChangePasswordDto {
    @ApiProperty({ example: 'password123', description: 'Mật khẩu hiện tại' })
    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
    currentPassword!: string;

    @ApiProperty({ example: 'demo12345678', description: 'Mật khẩu mới', minLength: 8 })
    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
    @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
    newPassword!: string;
}

export class ResetPasswordRequestDto {
    @ApiProperty({ example: 'user@example.com', description: 'Địa chỉ email để reset mật khẩu' })
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email!: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'Token reset mật khẩu nhận được qua email' })
    @IsString()
    @IsNotEmpty()
    token!: string;

    @ApiProperty({ example: 'newPassword123!', description: 'Mật khẩu mới', minLength: 8 })
    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
    @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
    newPassword!: string;
}

export class AuthResponseDto {
    accessToken!: string;
    user!: {
        id: string;
        email: string;
        fullName: string;
        avatarUrl: string | null;
        isAdmin: boolean;
        emailNotifications: boolean;
        taskUpdateNotifications: boolean;
        commentReplyNotifications: boolean;
        projectInviteNotifications: boolean;
    };
}
