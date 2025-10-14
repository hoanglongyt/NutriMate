import { Controller, Get, Param } from '@nestjs/common';
import { UsdaService } from '../service/usda.service';

@Controller()
export class AppController {
  constructor(
    private readonly usdaService: UsdaService,
  ) {}

  @Get('usda-food/:fdcId')
  async getUsdaFood(@Param('fdcId') fdcId: string) {
    return await this.usdaService.getFoodByFdcId(fdcId);
  }
}