import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
    password!: string;

    @IsString()
    @IsNotEmpty({ message: 'Họ tên không được để trống' })
    @MaxLength(100, { message: 'Họ tên quá dài' })
    fullName!: string;
}

export class LoginDto {
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email!: string;

    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    password!: string;
}

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu hiện tại không được để trống' })
    currentPassword!: string;

    @IsString()
    @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
    @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
    newPassword!: string;
}

export class ResetPasswordRequestDto {
    @IsEmail({}, { message: 'Email không hợp lệ' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    email!: string;
}

export class ResetPasswordDto {
    @IsString()
    @IsNotEmpty()
    token!: string;

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
    };
}
