import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.services';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Injectable()
export class UserProfileService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const { weightKg, heightCm, ...rest } = dto;

    let bmi: number | undefined = undefined;

    if (weightKg && heightCm) {
      // Công thức BMI = Cân nặng (kg) / (Chiều cao (m) * Chiều cao (m))
      const heightInMeters = heightCm / 100;
      bmi = parseFloat(
        (weightKg / (heightInMeters * heightInMeters)).toFixed(2),
      );
    }

    return this.prisma.userProfile.upsert({
      where: { userId: userId }, 
      create: {
        // Nếu tạo mới
        userId: userId,
        weightKg: weightKg,
        heightCm: heightCm,
        ...rest,
        bmi: bmi, // Lưu BMI đã tính
      },
      update: {
        // Nếu cập nhật
        weightKg: weightKg,
        heightCm: heightCm,
        ...rest,
        bmi: bmi, // Cập nhật BMI
      },
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException('Chưa có hồ sơ, vui lòng cập nhật.');
    }
    return profile;
  }

}