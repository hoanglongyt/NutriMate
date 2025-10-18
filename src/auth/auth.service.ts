import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.services';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private JwtService: JwtService,
    ) {}
    
    // Đăng ký người dùng
    async register (dto: RegisterDto) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email} });
        if (existingUser) {
            throw new BadRequestException('Email Already in use');
        }

        const salt = await bcrypt.genSalt();
        const passwordHash = await bcrypt.hash(dto.password, salt);

        const user = await this.prisma.user.create({
           data: {
            email: dto.email,
            passwordHash: passwordHash,
            fullName: dto.fullname,
            gender: dto.gender,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
           },
           select: { id: true, email: true, fullName: true}, 
        });
        return user;
    }

    // Xác thực và đăng nhập
    async login(dto: LoginDto) {
        
        const user = await this.prisma.user.findUnique({ where: { email: dto.email} });
        if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
        throw new UnauthorizedException('Email or password is incorrect');
        }

        const payload = {
            email: user.email,
            sub: user.id
        };

        // JWT Token
        return {
            access_token: this.JwtService.sign(payload),
            user: { id: user.id, email: user.email, fullname: user.fullName},
        };
    }

}