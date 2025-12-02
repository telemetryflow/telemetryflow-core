import { startTracing } from './otel/tracing';

// Start OpenTelemetry before anything else
startTracing();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use Winston logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);
  
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('TelemetryFlow Core API')
    .setDescription('IAM Module API with 5-Tier RBAC')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('IAM', 'Identity and Access Management')
    .addTag('Users', 'User management')
    .addTag('Roles', 'Role management')
    .addTag('Permissions', 'Permission management')
    .addTag('Tenants', 'Tenant management')
    .addTag('Organizations', 'Organization management')
    .addTag('Workspaces', 'Workspace management')
    .addTag('Groups', 'Group management')
    .addTag('Regions', 'Region management')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger UI: http://localhost:${port}/api`, 'Bootstrap');
  logger.log(`OpenTelemetry: ${process.env.OTEL_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`, 'Bootstrap');
}
bootstrap();
