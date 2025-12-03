import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LinkSocialDto } from './dto/link-social.dto';
import { SocialProvider } from './types/social-provider.enum';
import { SocialProfilePayload } from './types/social-profile.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    return HttpStatus.OK;
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request & { user: SocialProfilePayload }) {
    return this.authService.handleSocialLogin(SocialProvider.GOOGLE, req.user);
  }

  @Post('google/verify')
  async verifyGoogleToken(@Body('token') googleIdToken: string) {
    return this.authService.verifyGoogleToken(googleIdToken);
  }

  @Post('link-social')
  @UseGuards(JwtAuthGuard)
  async linkSocialAccount(
    @Req() req: Request & { user: { id: string } },
    @Body() dto: LinkSocialDto,
  ) {
    return this.authService.linkSocialAccount(req.user.id, dto);
  }
}
