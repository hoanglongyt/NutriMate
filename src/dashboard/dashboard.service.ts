import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.services';
import dayjs from 'dayjs';

@Injectable()
export class DashBoardService {
  constructor(private prisma: PrismaService) {}

  // get all information in 1 day (today is a default)
  async getDailySummary(userId: string, date: Date = new Date()) {
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    // Chạy 4 truy vấn song song để tăng hiệu suất
    const [mealLogs, workoutLogs, profile, recommendation] =
      await Promise.all([
        this.prisma.mealLog.findMany({
          where: {
            userId: userId,
            loggedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),

        this.prisma.workoutLog.findMany({
          where: {
            userId: userId,
            loggedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        }),

        this.prisma.userProfile.findUnique({ where: { userId } }),

        this.prisma.recommendation.findFirst({
          where: { userId },
          orderBy: { generatedAt: 'desc' },
        }),
      ]);

    const caloriesConsumed = mealLogs.reduce(
      (sum, log) => sum + (log.totalCalories || 0), 
      0,
    );

    const caloriesBurned = workoutLogs.reduce(
      (sum, log) => sum + (log.caloriesBurned || 0), 
      0,
    );

    const netCalories = caloriesConsumed - caloriesBurned;
    const targetCalories = recommendation?.recommendedCalories || null;

    // return to synthetic information
    return {
      date: dayjs(date).format('YYYY-MM-DD'),
      caloriesConsumed: parseFloat(caloriesConsumed.toFixed(2)),
      caloriesBurned: parseFloat(caloriesBurned.toFixed(2)),
      netCalories: parseFloat(netCalories.toFixed(2)),
      targetCalories: targetCalories,
      remainingCalories: targetCalories
        ? parseFloat((targetCalories - netCalories).toFixed(2))
        : null,
      bmi: profile?.bmi || null,
    };
  }
}