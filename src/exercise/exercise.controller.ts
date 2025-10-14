import { Controller, Get, Post, Body, Param, Patch, Delete, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ExerciseService } from './exercise.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@UseGuards()
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  findAll() {
    return this.exerciseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.exerciseService.findOne(id);
  }

  @Post()
  create(@Body() data: CreateExerciseDto) {
    return this.exerciseService.create(data);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() data: UpdateExerciseDto,
  ) {
    return this.exerciseService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.exerciseService.delete(id);
  }
}