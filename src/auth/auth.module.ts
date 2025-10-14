import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
       imports: [PrismaModule, PassportModule, JwtModule.registerAsync({
            imports: [ConfigModule],

            useFactory: async (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET') ?? 'a_fallback_secret_key' ,
                signOptions: {
                    expiresIn: configService.get('JWT_EXPIRATION_TIME')  ?? '7d',
                },
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],

    exports: [AuthService, JwtModule, PassportModule]
})

export class AuthModule {}