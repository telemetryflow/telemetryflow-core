import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";

import { SsoProviderEntity } from "./infrastructure/entities/SsoProvider.entity";
import { SsoConnectionEntity } from "./infrastructure/entities/SsoConnection.entity";
import { UserEntity } from "../iam/infrastructure/persistence/entities/User.entity";
import { UserRoleEntity } from "../iam/infrastructure/persistence/entities/UserRole.entity";

import { SsoService } from "./sso.service";
import { SsoController } from "./sso.controller";
import { OAuth2ProviderFactory } from "./providers/oauth2.provider";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SsoProviderEntity,
      SsoConnectionEntity,
      UserEntity,
      UserRoleEntity,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => ({
        secret: configService.get<string>("JWT_SECRET") || "default-secret",
        signOptions: {
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") ||
            "24h") as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SsoController],
  providers: [SsoService, OAuth2ProviderFactory],
  exports: [SsoService],
})
export class SsoModule {}
