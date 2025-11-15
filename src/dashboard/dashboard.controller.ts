import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { DashBoardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; 
import { GetSummaryDto } from './dto/get-summary.dto'; 

@Controller('dashboard')
@UseGuards(JwtAuthGuard) 
export class DashBoardController {
  constructor(private readonly dashboardService: DashBoardService) {}

  @Get('summary')
  async getSummary(
    @Req() req,
    @Query() query: GetSummaryDto, 
  ) {
    const userId = req.user.id;
    const date = query.date ? new Date(query.date) : new Date();
    return this.dashboardService.getDailySummary(userId, date);
  }
}