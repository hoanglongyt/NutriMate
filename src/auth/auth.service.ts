import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../src/prisma/prisma.services';
import { LinkSocialDto } from './dto/link-social.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  SocialProvider,
  SocialProviderField,
} from './types/social-provider.enum';
import { SocialProfilePayload } from './types/social-profile.interface';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email Already in use');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullname,
        gender: dto.gender,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
      },
      select: { id: true, email: true, fullName: true },
    });
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email or password is incorrect');
    }

    return this.buildAuthResponse(user);
  }

  async handleSocialLogin(
    provider: SocialProvider,
    profile: SocialProfilePayload,
  ) {
    if (!profile?.providerId) {
      throw new UnauthorizedException('Invalid social profile returned');
    }

    const user = await this.upsertUserFromSocialProfile(provider, profile);
    return this.buildAuthResponse(user);
  }

  async verifyGoogleToken(googleIdToken: string) {
    if (!googleIdToken) {
      throw new BadRequestException('Google ID token is required');
    }

    const audience = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!audience) {
      throw new UnauthorizedException('Google client configuration missing');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: googleIdToken,
      audience,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.sub) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const profile: SocialProfilePayload = {
      provider: SocialProvider.GOOGLE,
      providerId: payload.sub,
      email: payload.email ?? undefined,
      fullName: payload.name ?? undefined,
    };

    const user = await this.upsertUserFromSocialProfile(
      SocialProvider.GOOGLE,
      profile,
    );
    return this.buildAuthResponse(user);
  }

  async linkSocialAccount(userId: string, dto: LinkSocialDto) {
    const field = this.resolveProviderField();

    const conflict = await this.prisma.user.findFirst({
      where: {
        NOT: { id: userId },
        [field]: dto.providerUserId,
      },
    });

    if (conflict) {
      throw new BadRequestException('This social account is already linked.');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { [field]: dto.providerUserId },
      select: {
        id: true,
        email: true,
        fullName: true,
        googleId: true,
      },
    });
  }

  private async upsertUserFromSocialProfile(
    provider: SocialProvider,
    profile: SocialProfilePayload,
  ) {
    const field = this.resolveProviderField();
    const user = await this.prisma.user.findFirst({
      where: { [field]: profile.providerId },
    });

    if (user) {
      return user;
    }

    if (profile.email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingByEmail) {
        return this.prisma.user.update({
          where: { id: existingByEmail.id },
          data: { [field]: profile.providerId },
        });
      }
    }

    const passwordHash = await bcrypt.hash(
      this.createRandomPassword(),
      await bcrypt.genSalt(),
    );

    const userPayload: Prisma.UserCreateInput = {
      email:
        profile.email ?? `${profile.provider}-${profile.providerId}@auth.local`,
      passwordHash,
      fullName: profile.fullName ?? 'Social User',
      [field]: profile.providerId,
    };

    return this.prisma.user.create({
      data: userPayload,
    });
  }

  private resolveProviderField(): SocialProviderField {
    return 'googleId';
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    fullName: string;
  }) {
    const payload = {
      email: user.email,
      sub: user.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, fullName: user.fullName },
    };
  }

  private createRandomPassword() {
    return randomBytes(16).toString('hex');
  }
}
