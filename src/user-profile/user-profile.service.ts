import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.services';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { RecommendationService } from 'src/calculator/recommendation/recommendation.service';

@Injectable()
export class UserProfileService {
  constructor(
    private prisma: PrismaService,
    private recommendationService: RecommendationService,
    private configService: ConfigService,
  ) {}

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const { weightKg, heightCm, ...rest } = dto;

    let bmi: number | undefined = undefined;

    if (weightKg && heightCm) {
      const heightInMeters = heightCm / 100;
      bmi = parseFloat(
        (weightKg / (heightInMeters * heightInMeters)).toFixed(2),
      );
    }

    const updatedProfile = await this.prisma.userProfile.upsert({
      where: { userId: userId },
      create: {
        userId: userId,
        weightKg: weightKg,
        heightCm: heightCm,
        ...rest,
        bmi: bmi,
      },
      update: {
        weightKg: weightKg,
        heightCm: heightCm,
        ...rest,
        bmi: bmi,
      },
    });

    // Regenerate recommendation sau khi cập nhật profile (đặc biệt quan trọng khi thay đổi weight/targetWeight/activityLevel)
    // QUAN TRỌNG: Phải await để đảm bảo recommendation được cập nhật TRƯỚC KHI trả response
    // Nếu không await, frontend có thể fetch summary trước khi recommendation được tạo xong
    try {
      await this.recommendationService.generateRecommendation(userId);
      console.log(`✅ Recommendation đã được regenerate cho user ${userId}`);
    } catch (error) {
      // Log lỗi nhưng không throw để không ảnh hưởng đến việc update profile
      console.error('❌ Lỗi khi regenerate recommendation:', error);
    }

    return updatedProfile;
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: userId },
    });

    if (!profile) {
      throw new NotFoundException('Chưa có hồ sơ, vui lòng cập nhật.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profilePictureUrl: true },
    });

    return {
      ...profile,
      profilePictureUrl: user?.profilePictureUrl || null,
    };
  }

  async updateProfilePicture(userId: string, fileUrl: string) {
    try {
      // Construct full public URL from relative path
      // fileUrl is expected to be a relative path like '/uploads/profile-pictures/filename.jpg'
      const baseUrl = this.configService.get<string>('APP_URL') || 
                     this.configService.get<string>('BASE_URL') ||
                     `http://localhost:${this.configService.get<number>('PORT') || 3000}`;
      
      // Ensure fileUrl starts with '/' for proper URL construction
      const relativePath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
      
      // Construct full public URL
      const fullPublicUrl = `${baseUrl}${relativePath}`;
      
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { profilePictureUrl: fullPublicUrl },
        select: { 
          id: true, 
          email: true, 
          fullName: true, 
          profilePictureUrl: true 
        }, 
      });
      return user; 

    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }
}
