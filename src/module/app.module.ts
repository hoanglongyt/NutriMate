import { Module } from '@nestjs/common';
import { AppController } from '../controller/app.controller';
import { UsdaService } from '../service/usda.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [UsdaService],
})
export class AppModule {}
