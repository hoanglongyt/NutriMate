import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, } from '@nestjs/common';
import { WorkoutLogService } from './workout-log.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; 

@UseGuards(JwtAuthGuard) 
@Controller('workout-logs')
export class WorkoutLogController {
  constructor(private readonly workoutLogService: WorkoutLogService) {}

  @Post()
  create(@Body() createWorkoutLogDto: CreateWorkoutLogDto, @Req() req) {
    const userId = req.user.id;
    return this.workoutLogService.create(userId, createWorkoutLogDto);
  }

  @Get()
  findAll(@Req() req) {
    const userId = req.user.id;
    return this.workoutLogService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.workoutLogService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkoutLogDto: UpdateWorkoutLogDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.workoutLogService.update(id, userId, updateWorkoutLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.workoutLogService.remove(id, userId);
  }
}