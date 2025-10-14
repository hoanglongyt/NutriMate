import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MealLogService } from './meal-log.service';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';

@UseGuards()
@Controller('meal-logs')
export class MealLogController {
  constructor(private readonly mealLogService: MealLogService) {}

  @Post()
  create(@Body() createMealLogDto: CreateMealLogDto) {
    return this.mealLogService.create(createMealLogDto);
  }

  @Get()
  findAll() {
    return this.mealLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mealLogService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMealLogDto: UpdateMealLogDto) {
    return this.mealLogService.update(id, updateMealLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mealLogService.remove(id);
  }
}