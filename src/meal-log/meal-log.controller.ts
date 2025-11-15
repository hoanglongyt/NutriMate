import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, } from '@nestjs/common';
import { MealLogService } from './meal-log.service';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@UseGuards(JwtAuthGuard) 
@Controller('meal-logs')
export class MealLogController {
  constructor(private readonly mealLogService: MealLogService) {}

  @Post()
  create(@Body() createMealLogDto: CreateMealLogDto, @Req() req) {
    const userId = req.user.id;
    return this.mealLogService.create(userId, createMealLogDto);
  }

  @Get()
  findAll(@Req() req) {
    const userId = req.user.id;
    return this.mealLogService.findAll(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.mealLogService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateMealLogDto: UpdateMealLogDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    return this.mealLogService.update(id, userId, updateMealLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.mealLogService.remove(id, userId);
  }
}