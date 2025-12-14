import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.services';
import dayjs from 'dayjs';

@Injectable()
export class DashBoardService {
  constructor(private prisma: PrismaService) {}

  async getDailySummary(userId: string, date: Date = new Date()) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    // 1. LẤY DỮ LIỆU
    const [mealLogs, workoutLogs, profile, recommendation] = await Promise.all([
      this.prisma.mealLog.findMany({
        where: { userId, loggedAt: { gte: startOfDay, lte: endOfDay } },
        include: { food: true },
      }),
      this.prisma.workoutLog.findMany({
        where: { userId, loggedAt: { gte: startOfDay, lte: endOfDay } },
      }),
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.recommendation.findFirst({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
      }),
    ]);

    // 2. TÍNH TOÁN CALO & MACRO
    let caloriesConsumed = 0;
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;

    mealLogs.forEach((log) => {
      // Cộng calo (Lấy từ log đã lưu)
      caloriesConsumed += log.totalCalories || 0;

      // Cộng Macro (Tính từ Food gốc)
      if (log.food) {
        // Công thức: (Chất trong 100g / 100) * Số lượng thực tế
        const proteinPerGram = (log.food.protein || 0) / 100;
        const fatPerGram = (log.food.fat || 0) / 100;
        const carbsPerGram = (log.food.carbs || 0) / 100;

        totalProtein += proteinPerGram * log.quantity;
        totalFat += fatPerGram * log.quantity;
        totalCarbs += carbsPerGram * log.quantity;
      }
    });

    const caloriesBurned = workoutLogs.reduce(
      (sum, log) => sum + (log.caloriesBurned || 0),
      0,
    );
    const netCalories = caloriesConsumed - caloriesBurned;
    const targetCalories = recommendation?.recommendedCalories || 2000;

    // 3. TRẢ VỀ KẾT QUẢ
    return {
      date: dayjs(date).format('YYYY-MM-DD'),
      caloriesConsumed: parseFloat(caloriesConsumed.toFixed(2)),
      caloriesBurned: parseFloat(caloriesBurned.toFixed(2)),
      netCalories: parseFloat(netCalories.toFixed(2)),
      targetCalories: targetCalories,
      remainingCalories: parseFloat((targetCalories - netCalories).toFixed(2)),
      bmi: profile?.bmi || null,

      // Trả về Macro đã tính (consumed)
      totalProtein: parseFloat(totalProtein.toFixed(1)),
      totalFat: parseFloat(totalFat.toFixed(1)),
      totalCarbs: parseFloat(totalCarbs.toFixed(1)),

      // Trả về Macro targets từ backend recommendations
      targetProtein: recommendation?.recommendedProtein || null,
      targetFat: recommendation?.recommendedFat || null,
      targetCarbs: recommendation?.recommendedCarbs || null,
    };
  }
}
