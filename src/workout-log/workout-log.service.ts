import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { PrismaService } from 'src/prisma/prisma.services';

@Injectable()
export class WorkoutLogService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createWorkoutLogDto: CreateWorkoutLogDto) {
    const { exerciseId, durationMin } = createWorkoutLogDto;

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { caloriesBurnedPerHour: true },
    });

    if (!exercise) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found.`);
    }

    const totalCaloriesBurned = (exercise.caloriesBurnedPerHour / 60) * durationMin;

    return this.prisma.workoutLog.create({
      data: {
        userId: userId, 
        exerciseId: exerciseId,
        durationMin: durationMin,
        caloriesBurned: totalCaloriesBurned, 
      },
    });
  }

  findAll(userId: string) {
    return this.prisma.workoutLog.findMany({
      where: { userId: userId }, 
      orderBy: { loggedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const log = await this.prisma.workoutLog.findFirst({
      where: { id: id, userId: userId },
    });

    if (!log) {
      throw new NotFoundException('Workout log not found.');
    }
    return log;
  }

  async update(
    id: string,
    userId: string,
    updateWorkoutLogDto: UpdateWorkoutLogDto,
  ) {
    await this.findOne(id, userId);

    return this.prisma.workoutLog.update({
      where: { id: id },
      data: updateWorkoutLogDto,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.workoutLog.delete({
      where: { id: id },
    });
  }
}