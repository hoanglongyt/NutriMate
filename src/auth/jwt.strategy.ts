// src/auth/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.services'; // Đảm bảo đường dẫn tương đối là chính xác

// Định nghĩa kiểu dữ liệu cho payload giải mã từ JWT
interface JwtPayload {
    sub: string; // ID người dùng (Subject)
    email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // 1. Cách trích xuất Token: Lấy từ header 'Authorization: Bearer <token>'
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      // 2. Không bỏ qua việc hết hạn (kiểm tra token còn hạn không)
      ignoreExpiration: false,
      // 3. Khóa bí mật để giải mã token (PHẢI TRÙNG VỚI KHÓA TRONG AuthModule)
      secretOrKey: 'YOUR_SECRET_KEY', 
      // LƯU Ý: Thay thế 'YOUR_SECRET_KEY' bằng process.env.JWT_SECRET trong thực tế.
    });
  }

  // Phương thức này được gọi sau khi token được giải mã thành công
  async validate(payload: JwtPayload) {
    // 1. Tìm người dùng trong DB dựa trên ID (sub)
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    // 2. Kiểm tra người dùng có tồn tại không
    if (!user) {
        throw new UnauthorizedException('User not found or token invalid.');
    }
    
    // 3. Trả về đối tượng người dùng (Sẽ được gắn vào request.user)
    // Loại bỏ passwordHash vì lý do bảo mật
    const { passwordHash, ...result } = user;
    return result; 
  }
}