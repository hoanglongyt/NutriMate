import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FoodService } from './food.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { IsNotEmpty, IsString } from 'class-validator';

export class SearchFoodDto {
  @IsString()
  @IsNotEmpty({ message: 'Từ khóa tìm kiếm (q) không được để trống.' })
  q!: string;
}

@Controller('food')
@UseGuards(JwtAuthGuard)
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  @Get('search')
  async hybridSearch(@Query() query: SearchFoodDto) {
    const searchQuery = query.q;

    const [localResults, externalResults] = await Promise.all([
      this.foodService.searchLocalFood(searchQuery),
      this.foodService.searchFoodFromUSDA(searchQuery),
    ]);

    return [...localResults, ...externalResults];
  }
}