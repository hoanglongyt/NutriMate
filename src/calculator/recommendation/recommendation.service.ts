import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.services';
import { HealthService } from '../health/health.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import dayjs from 'dayjs';
import { ActivityLevel } from '@prisma/client';

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);
  private readonly mlApiUrl: string;

  constructor(
    private prisma: PrismaService,
    private healthService: HealthService,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    // Lấy ML API URL từ env, mặc định là http://localhost:8000
    this.mlApiUrl = this.configService.get<string>('ML_API_URL') || 'http://localhost:8000';
  }

  // calculate and create/update recommendation calories for user
  async generateRecommendation(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (
      !user ||
      !user.profile ||
      !user.dateOfBirth ||
      !user.profile.activityLevel
    ) {
      throw new NotFoundException('Dữ liệu hồ sơ không đầy đủ để tạo gợi ý.');
    }

    const profile = user.profile;
    const age = dayjs().diff(dayjs(user.dateOfBirth), 'year');

    // Ưu tiên gọi FastAPI ML Service, fallback về logic cũ nếu lỗi
    try {
      return await this.generateRecommendationFromML(userId, user, profile, age);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.warn(`ML API không khả dụng, sử dụng logic fallback: ${errorMessage}`);
      return await this.generateRecommendationFallback(userId, user, profile, age);
    }
  }

  // Gọi FastAPI ML Service để tính recommendations
  private async generateRecommendationFromML(
    userId: string,
    user: any,
    profile: any,
    age: number,
  ) {
    // Chuẩn bị request body cho FastAPI
    const requestBody = {
      weightKg: profile.weightKg,
      heightCm: profile.heightCm,
      age: age,
      gender: user.gender === 'Male' ? 'Nam' : 'Nữ', // Convert NestJS format to FastAPI format
      activityLevel: profile.activityLevel, // ActivityLevel enum từ Prisma
      targetWeightKg: profile.targetWeightKg || null,
      goal: null, // Có thể thêm goal field sau nếu cần
    };

    this.logger.log(`Gọi FastAPI ML Service với: ${JSON.stringify(requestBody)}`);

    // Gọi FastAPI
    const response = await firstValueFrom(
      this.httpService.post(`${this.mlApiUrl}/recommendations`, requestBody, {
        timeout: 5000, // 5 seconds timeout
      }),
    );

    const mlResult = response.data;
    this.logger.log(`FastAPI response: ${JSON.stringify(mlResult)}`);

    // Parse response từ FastAPI
    const targetCalories = mlResult.recommendedCalories;
    const recommendedProtein = mlResult.macros.proteinGram;
    const recommendedFat = mlResult.macros.fatGram;
    const recommendedCarbs = mlResult.macros.carbGram;
    const exerciseSuggestion = mlResult.note || 'Duy trì thói quen luyện tập để giữ cân.';

    this.logger.log(`Parsed: targetCalories=${targetCalories}, protein=${recommendedProtein}, fat=${recommendedFat}, carbs=${recommendedCarbs}`);

    // Tìm bản ghi cũ
    const existingRec = await this.prisma.recommendation.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });

    // Lưu vào DB
    return this.prisma.recommendation.upsert({
      where: { id: existingRec?.id || 'non-existing-id-to-force-create' },

      update: {
        recommendedCalories: parseFloat(targetCalories.toFixed(2)),
        recommendedProtein: parseFloat(recommendedProtein.toFixed(1)),
        recommendedFat: parseFloat(recommendedFat.toFixed(1)),
        recommendedCarbs: parseFloat(recommendedCarbs.toFixed(1)),
        recommendedExercise: exerciseSuggestion,
        generatedAt: new Date(),
      },

      create: {
        userId: userId,
        recommendedCalories: parseFloat(targetCalories.toFixed(2)),
        recommendedProtein: parseFloat(recommendedProtein.toFixed(1)),
        recommendedFat: parseFloat(recommendedFat.toFixed(1)),
        recommendedCarbs: parseFloat(recommendedCarbs.toFixed(1)),
        recommendedExercise: exerciseSuggestion,
      },
    });
  }

  // Fallback logic (giữ nguyên logic cũ nếu ML API không available)
  private async generateRecommendationFallback(
    userId: string,
    user: any,
    profile: any,
    age: number,
  ) {
    // 1. Tính BMR (Basal Metabolic Rate)
    const bmr = this.healthService.calculateBMR(
      user.gender as string,
      profile.weightKg as number,
      profile.heightCm as number,
      age,
    );

    // 2. Tính TDEE (Total Daily Energy Expenditure)
    const tdee = this.healthService.calculateTDEE(
      bmr,
      profile.activityLevel as ActivityLevel,
    );

    // 3. Tính Calo Mục tiêu (Target Calories)
    let targetCalories = tdee;
    let exerciseSuggestion = 'Duy trì thói quen luyện tập để giữ cân.';

    if (profile.targetWeightKg) {
      const diff = profile.targetWeightKg - (profile.weightKg || 0);

      if (Math.abs(diff) < 0.5) {
        targetCalories = tdee;
        exerciseSuggestion = 'Bạn đã đạt cân nặng mục tiêu! Hãy duy trì.';
      } else if (diff > 0) {
        targetCalories = tdee + 500;
        exerciseSuggestion = 'Tập luyện sức mạnh (Gym) kết hợp ăn dư calo để tăng cơ.';
      } else {
        targetCalories = tdee - 500;
        exerciseSuggestion = 'Kết hợp Cardio và giảm calo để đốt mỡ hiệu quả.';
      }
    }

    // 4. Giới hạn an toàn
    if (targetCalories < bmr) {
      targetCalories = bmr;
    }

    // 5. TÍNH MACRO TARGETS (logic cũ)
    const isWeightGain = profile.targetWeightKg && profile.targetWeightKg > (profile.weightKg || 0);
    const isWeightLoss = profile.targetWeightKg && profile.targetWeightKg < (profile.weightKg || 0);
    const isHighActivity = profile.activityLevel === ActivityLevel.ACTIVE || profile.activityLevel === ActivityLevel.VERY_ACTIVE;

    let proteinPercent: number, fatPercent: number, carbPercent: number;

    if (isWeightGain) {
      if (isHighActivity) {
        proteinPercent = 0.35;
        fatPercent = 0.25;
        carbPercent = 0.40;
      } else {
        proteinPercent = 0.30;
        fatPercent = 0.30;
        carbPercent = 0.40;
      }
    } else if (isWeightLoss) {
      if (isHighActivity) {
        proteinPercent = 0.40;
        fatPercent = 0.25;
        carbPercent = 0.35;
      } else {
        proteinPercent = 0.35;
        fatPercent = 0.30;
        carbPercent = 0.35;
      }
    } else {
      if (isHighActivity) {
        proteinPercent = 0.30;
        fatPercent = 0.25;
        carbPercent = 0.45;
      } else {
        proteinPercent = 0.30;
        fatPercent = 0.30;
        carbPercent = 0.40;
      }
    }

    const recommendedProtein = parseFloat(((targetCalories * proteinPercent) / 4).toFixed(1));
    const recommendedFat = parseFloat(((targetCalories * fatPercent) / 9).toFixed(1));
    const recommendedCarbs = parseFloat(((targetCalories * carbPercent) / 4).toFixed(1));

    // Tìm bản ghi cũ
    const existingRec = await this.prisma.recommendation.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });

    // Lưu vào DB
    return this.prisma.recommendation.upsert({
      where: { id: existingRec?.id || 'non-existing-id-to-force-create' },

      update: {
        recommendedCalories: parseFloat(targetCalories.toFixed(2)),
        recommendedProtein: recommendedProtein,
        recommendedFat: recommendedFat,
        recommendedCarbs: recommendedCarbs,
        recommendedExercise: exerciseSuggestion,
        generatedAt: new Date(),
      },

      create: {
        userId: userId,
        recommendedCalories: parseFloat(targetCalories.toFixed(2)),
        recommendedProtein: recommendedProtein,
        recommendedFat: recommendedFat,
        recommendedCarbs: recommendedCarbs,
        recommendedExercise: exerciseSuggestion,
      },
    });
  }

  // Lấy gợi ý mới nhất
  async findLatestRecommendation(userId: string) {
    return this.prisma.recommendation.findFirst({
      where: { userId },
      orderBy: { generatedAt: 'desc' },
    });
  }
}
