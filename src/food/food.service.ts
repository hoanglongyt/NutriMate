import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.services';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService, // Dùng để gọi API ngoài
    private readonly configService: ConfigService, // Dùng để đọc .env
  ) {}

  async searchLocalFood(query: string) {
    return this.prisma.food.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 20, 
    });
  }

  async searchFoodFromUSDA(query: string) {
    const apiKey = this.configService.get<string>('USDA_API_KEY');
    if (!apiKey) {
      // Nếu không có key, trả về mảng rỗng, không làm sập server
      this.logger.warn('Không tìm thấy USDA_API_KEY, bỏ qua tìm kiếm USDA.');
      return [];
    }

    const url = 'https://api.nal.usda.gov/fdc/v1/foods/search';

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            api_key: apiKey,
            query: query,
            pageSize: 20,
            dataType: 'Foundation,SR Legacy',
          },
        }),
      );

      const getNutrient = (nutrients: any[], nutrientId: number) => {
        const nutrient = nutrients.find((n) => n.nutrientId === nutrientId);
        return nutrient ? nutrient.value : undefined;
      };

      // Map lại dữ liệu chi tiết
      return response.data.foods.map((food: any) => {
        const nutrients = food.foodNutrients || [];
        return {
          id: food.fdcId.toString(), // ID từ USDA
          name: food.description,
          source: 'usda',
          unit: '100g',

          // === Macronutrients ===
          calories: getNutrient(nutrients, 1008), // Energy (Kcal)
          protein: getNutrient(nutrients, 1003), // Protein (g)
          fat: getNutrient(nutrients, 1004), // Fat (g)
          carbs: getNutrient(nutrients, 1005), // Carbs (g)

          // === Chi tiết (Detail Macros) ===
          fiber: getNutrient(nutrients, 1079), // Fiber (g)
          sugar: getNutrient(nutrients, 2000), // Sugars, total (g)
          saturatedFat: getNutrient(nutrients, 1258), // Fatty acids, saturated (g)
          cholesterol: getNutrient(nutrients, 1253), // Cholesterol (mg)

          // === Khoáng chất (Minerals) ===
          sodium: getNutrient(nutrients, 1093), // Sodium (mg)
          potassium: getNutrient(nutrients, 1092), // Potassium (mg)
          calcium: getNutrient(nutrients, 1087), // Calcium (mg)
          iron: getNutrient(nutrients, 1089), // Iron (mg)
          magnesium: getNutrient(nutrients, 1090), // Magnesium (mg)

          // === Vitamins ===
          vitaminA: getNutrient(nutrients, 1106), // Vitamin A, RAE (µg)
          vitaminC: getNutrient(nutrients, 1162), // Vitamin C (mg)
          vitaminD: getNutrient(nutrients, 1110), // Vitamin D (D2 + D3) (µg)
          vitaminE: getNutrient(nutrients, 1109), // Vitamin E (mg)
          vitaminK: getNutrient(nutrients, 1185), // Vitamin K (µg)
          vitaminB6: getNutrient(nutrients, 1175), // Vitamin B-6 (mg)
          vitaminB12: getNutrient(nutrients, 1178), // Vitamin B-12 (µg)
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Lỗi khi gọi API USDA: ${error.message}`);
      }else{
        this.logger.error(`Lỗi không xác định khi gọi API USDA: ${String(error)}`);
      }
      return []; 
    }
  }
}