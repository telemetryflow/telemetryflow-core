import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core";
import { LoggerModule } from "./logger/logger.module";
import { HttpLoggingInterceptor } from "./logger/http-logging.interceptor";
import { RequestContextMiddleware } from "./logger/middleware/request-context.middleware";
import { HealthModule } from "./health/health.module";
import { CacheModule } from "./shared/cache";
import { QueueModule } from "./shared/queue";
import { ClickHouseModule } from "./shared/clickhouse/clickhouse.module";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";
import { IAMModule } from "./modules/iam/iam.module";
import { TenancyModule } from "./modules/tenancy";
import { AuditModule } from "./modules/audit/audit.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ApiKeysModule } from "./modules/api-keys";
import { SsoModule } from "./modules/sso";
import { NotificationModule } from "./modules/notification/notification.module";
import { LLMModule } from "./modules/llm";
import { DataMaskingModule } from "./modules/data-masking/data-masking.module";
import { AlertingModule } from "./modules/alerting";
import { QueryModule } from "./modules/query/query.module";
import { RetentionModule } from "./modules/retention";
import { AuditInterceptor } from "./modules/audit/audit.interceptor";
import { AppController } from "./app.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../.env"] }),
    LoggerModule,
    HealthModule,
    CacheModule,
    QueueModule,
    ClickHouseModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      autoLoadEntities: true,
      logging: process.env.NODE_ENV === "development",
      synchronize: false,
    }),
    AuthModule,
    IAMModule,
    TenancyModule,
    ApiKeysModule,
    SsoModule,
    AuditModule,
    DataMaskingModule,
    AlertingModule,
    QueryModule,
    NotificationModule,
    LLMModule,
    RetentionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes("*");
  }
}
