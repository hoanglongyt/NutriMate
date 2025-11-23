import { Injectable, Logger, NotFoundException } from '@nestjs/common'; 
import { PrismaService } from 'src/prisma/prisma.services';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, retry } from 'rxjs'; 

@Injectable()
export class FoodService {
  private readonly logger = new Logger(FoodService.name);

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * (Đồ ăn Việt Nam)
   */
  async searchLocalFood(query: string) {
    return this.prisma.food.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      take: 20,
    });
  }

  /**
   * (USDA) 
   */
  async searchFoodFromUSDA(query: string) {
    const apiKey = this.configService.get<string>('USDA_API_KEY');

    if (!apiKey) {
      this.logger.warn('Không tìm thấy USDA_API_KEY, bỏ qua tìm kiếm USDA.');
      return [];
    }

    const baseUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search';

    const params = new URLSearchParams();
    params.append('api_key', apiKey);
    params.append('query', query);
    params.append('pageSize', '20');

    params.append('dataType', 'Foundation');
    params.append('dataType', 'SR Legacy');
    params.append('dataType', 'Branded'); 

    const finalUrl = `${baseUrl}?${params.toString()}`;

    this.logger.log(`🔍 Đang gọi USDA (Query: ${query})`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(finalUrl).pipe(
          retry(1) 
        )
      );

      if (!response.data || !Array.isArray(response.data.foods)) {
        this.logger.error('⚠️ Phản hồi USDA không có định dạng JSON/foods mong đợi.');
        const preview = JSON.stringify(response.data || 'null').substring(0, 100);
        this.logger.debug(`Data Preview: ${preview}...`);
        return [];
      }

      this.logger.log(`✅ USDA Thành công: Tìm thấy ${response.data.foods.length} kết quả`);

      const getNutrient = (nutrients: any[], nutrientId: number) => {
        const nutrient = nutrients.find((n) => n.nutrientId === nutrientId);
        return nutrient ? nutrient.value : undefined;
      };

      return response.data.foods.map((food: any) => {
        const nutrients = food.foodNutrients || [];
        return {
          id: food.fdcId.toString(),
          name: food.description,
          source: 'usda',
          unit: '100g',
          calories: getNutrient(nutrients, 1008),
          protein: getNutrient(nutrients, 1003),
          fat: getNutrient(nutrients, 1004),
          carbs: getNutrient(nutrients, 1005),
          fiber: getNutrient(nutrients, 1079),
          sugar: getNutrient(nutrients, 2000),
          saturatedFat: getNutrient(nutrients, 1258),
          cholesterol: getNutrient(nutrients, 1253),
          sodium: getNutrient(nutrients, 1093),
          potassium: getNutrient(nutrients, 1092),
          calcium: getNutrient(nutrients, 1087),
          iron: getNutrient(nutrients, 1089),
          magnesium: getNutrient(nutrients, 1090),
          vitaminA: getNutrient(nutrients, 1106),
          vitaminC: getNutrient(nutrients, 1162),
          vitaminD: getNutrient(nutrients, 1110),
          vitaminE: getNutrient(nutrients, 1109),
          vitaminK: getNutrient(nutrients, 1185),
          vitaminB6: getNutrient(nutrients, 1175),
          vitaminB12: getNutrient(nutrients, 1178),
        };
      });
    } catch (error: any) {
      this.logger.error(`❌ Lỗi khi gọi API USDA: ${error.message}`);
      if (error.response) {
        this.logger.error(`👉 Status Code: ${error.response.status}`);
        this.logger.error(`👉 Response Data: ${JSON.stringify(error.response.data).substring(0, 200)}...`);
      }
      return [];
    }
  }

  /**
   * TÌM BẰNG MÃ VẠCH (Open Food Facts)
   */
  async searchByBarcode(barcode: string) {
    // API Open Food Facts
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

    try {
      const response = await firstValueFrom(this.httpService.get(url));

      // Kiểm tra nếu sản phẩm không tồn tại
      if (!response.data || response.data.status === 0 || !response.data.product) {
        throw new NotFoundException(`Không tìm thấy sản phẩm với mã vạch: ${barcode}`);
      }

      // Lấy dữ liệu dinh dưỡng (nutriments)
      const product = response.data.product;
      // Dữ liệu dinh dưỡng nằm trong 'nutriments' và thường là trên 100g
      const nutriments = product.nutriments || {};

      return {
        id: product.code, 
        name: product.product_name || 'Không rõ tên',
        source: 'openfoodfacts',
        unit: '100g', 

        calories: nutriments['energy-kcal_100g'],
        protein: nutriments.proteins_100g,
        fat: nutriments.fat_100g,
        carbs: nutriments.carbohydrates_100g,
        fiber: nutriments.fiber_100g,
        sugar: nutriments.sugars_100g,
        saturatedFat: nutriments['saturated-fat_100g'],
        cholesterol: nutriments.cholesterol_100g,
        sodium: nutriments.sodium_100g,
        potassium: nutriments.potassium_100g,
        calcium: nutriments.calcium_100g,
        iron: nutriments.iron_100g,
        magnesium: nutriments.magnesium_100g,
        vitaminA: nutriments['vitamin-a_100g'],
        vitaminC: nutriments['vitamin-c_100g'],
        vitaminD: nutriments['vitamin-d_100g'],
        vitaminE: nutriments['vitamin-e_100g'],
        vitaminK: nutriments['vitamin-k_100g'],
        vitaminB6: nutriments['vitamin-b6_100g'],
        vitaminB12: nutriments['vitamin-b12_100g'],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Error) {
        this.logger.error(`Lỗi khi gọi API OpenFoodFacts: ${error.message}`);
      } else {
        this.logger.error(`Lỗi không xác định khi gọi API OpenFoodFacts: ${String(error)}`);
      }
      throw new Error('Lỗi tra cứu mã vạch.');
    }
  }
}