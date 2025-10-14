import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FoodService } from './food.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';

@UseGuards()
@Controller('foods') 
export class FoodController {
    constructor(private readonly foodService: FoodService) {}

    @Post()
    create(@Body() data: CreateFoodDto) {
        return this.foodService.create(data);
    }

    @Get()
    findAll() {
        return this.foodService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string ) {
        return this.foodService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateFoodDto) {
        return this.foodService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.foodService.remove(id);
    }
}