import { IsEmail, IsString, IsNotEmpty, MinLength, IsStrongPassword, IsOptional, IsDateString } from 'class-validator';

export class RegisterDto {
    @IsEmail({}, { message: 'Email không đúng định dạng.'})
    @IsNotEmpty({ message: 'Email không được để trống.' })
    email!: string;

    @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
    @IsString()
    @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
    @IsStrongPassword()
    password!: string;

    @IsNotEmpty({ message: 'Họ tên không được để trống.' })
    @IsString()
    fullname!: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Họ tên không được để trống.' })
    gender?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;
}