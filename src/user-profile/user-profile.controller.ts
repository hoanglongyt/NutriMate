import { Controller, Get, Body, Patch, UseGuards, Req, } from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'; 

@UseGuards(JwtAuthGuard) 
@Controller('user-profile') 
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Patch() 
  updateProfile(
    @Req() req,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    const userId = req.user.id;
    return this.userProfileService.updateProfile(userId, updateUserProfileDto);
  }

  @Get() 
  getProfile(@Req() req) {
    const userId = req.user.id;
    return this.userProfileService.getProfile(userId);
  }
}