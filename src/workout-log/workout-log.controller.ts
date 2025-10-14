import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { WorkoutLogService } from './workout-log.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';

@UseGuards()
@Controller('workout-logs')
export class WorkoutLogController {
  constructor(private readonly workoutLogService: WorkoutLogService) {}

  @Post()
  create(@Body() createWorkoutLogDto: CreateWorkoutLogDto) {
    return this.workoutLogService.create(createWorkoutLogDto);
  }

  @Get()
  findAll() {
    return this.workoutLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workoutLogService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkoutLogDto: UpdateWorkoutLogDto) {
    return this.workoutLogService.update(id, updateWorkoutLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workoutLogService.remove(id);
  }
}