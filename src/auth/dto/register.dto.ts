import { IsEmail, IsString, IsNotEmpty, MinLength, IsStrongPassword, IsOptional, IsDateString } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    email!: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(6)
    @IsStrongPassword()
    password!: string;

    @IsNotEmpty()
    @IsString()
    fullname!: string;

    @IsOptional()
    @IsString()
    gender?: string;

    @IsOptional()
    @IsDateString()
    dateOfBirth?: string;
}