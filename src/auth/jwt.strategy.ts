import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.services'; 
import { ConfigService } from '@nestjs/config';

interface JwtPayload {
    sub: string; 
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService, 
    private configService: ConfigService, 
    ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!, 
    });
  }

  // Phương thức này được gọi sau khi token được giải mã thành công
  async validate(payload: JwtPayload) {
    // 1. Tìm người dùng trong DB dựa trên ID (sub)
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
        throw new UnauthorizedException('User not found or token invalid.');
    }
    
    // 3. Trả về đối tượng người dùng (Sẽ được gắn vào request.user)

    const { passwordHash, ...result } = user;
    return result; 
  }
}