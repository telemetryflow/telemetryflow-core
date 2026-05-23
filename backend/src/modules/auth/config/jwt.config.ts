/**
 * JWT Configuration
 *
 * Configuration for JWT token generation and validation
 */

import { JwtModuleOptions } from "@nestjs/jwt";

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
}

export const getJwtConfig = (): JwtConfig => ({
  secret: process.env.JWT_SECRET || "default-jwt-secret-change-in-production",
  refreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "default-refresh-secret-change-in-production",
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
});

export const getJwtModuleOptions = (): JwtModuleOptions => {
  const config = getJwtConfig();

  return {
    secret: config.secret,
    signOptions: {
      expiresIn: config.accessTokenExpiry as any,
    },
  };
};
