import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
import { PrismaService } from 'src/prisma/prisma.services';

@Injectable()
export class MealLogService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createMealLogDto: CreateMealLogDto) {
    const { foodId, quantity, mealType } = createMealLogDto;

    // find food information
    const food = await this.prisma.food.findUnique({
      where: { id: foodId },
      select: { calories: true },
    });

    if (!food) {
      throw new NotFoundException(`Food with ID ${foodId} not found.`);
    }

    // Calories Calculate
    const calculatedCalories = (food.calories / 100) * quantity;

    return this.prisma.mealLog.create({
      data: {
        userId: userId, 
        foodId: foodId,
        quantity: quantity,
        mealType: mealType,
        totalCalories: calculatedCalories, 
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.mealLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' }, 
    });
  }

  async findOne(id: string, userId: string) {
    const log = await this.prisma.mealLog.findFirst({
      where: { id, userId }, 
    });

    if (!log) {
      throw new NotFoundException(`Meal log not found.`);
    }
    return log;
  }

  async update(id: string, userId: string, updateMealLogDto: UpdateMealLogDto) {
    const existingLog = await this.findOne(id, userId);

    return this.prisma.mealLog.update({
      where: { id }, 
      data: updateMealLogDto,
    });
  }

  async remove(id: string, userId: string) {
    const existingLog = await this.findOne(id, userId);

    return this.prisma.mealLog.delete({
      where: { id },
    });
  }
}