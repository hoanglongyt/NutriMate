import { Module } from '@nestjs/common';
import { FoodService } from './food.service';
import { FoodController } from './food.controller';

import { PrismaModule } from 'src/prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule, 
    HttpModule, 
    ConfigModule,
  ],
  controllers: [FoodController],
  providers: [
    FoodService,
  ],
})
export class FoodModule {}