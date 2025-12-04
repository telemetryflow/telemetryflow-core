import { startTracing } from './otel/tracing';

// Start OpenTelemetry before anything else
startTracing();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api/v2', { exclude: ['', 'health', 'metrics', 'version'] });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();

  // Swagger/OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('TelemetryFlow Core API')
    .setDescription('IAM Module API with 5-Tier RBAC System\n\n' +
      '**Default Users:**\n' +
      '- Super Admin: superadmin.telemetryflow@telemetryflow.id / SuperAdmin@123456\n' +
      '- Administrator: administrator.telemetryflow@telemetryflow.id / Admin@123456\n' +
      '- Developer: developer.telemetryflow@telemetryflow.id / Developer@123456\n' +
      '- Viewer: viewer.telemetryflow@telemetryflow.id / Viewer@123456\n' +
      '- Demo: demo.telemetryflow@telemetryflow.id / Demo@123456')
    .setVersion('1.1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
    })
    .addTag('iam-users', 'User management operations')
    .addTag('iam-roles', 'Role management operations')
    .addTag('iam-permissions', 'Permission management operations')
    .addTag('iam-tenants', 'Tenant management operations')
    .addTag('iam-organizations', 'Organization management operations')
    .addTag('iam-workspaces', 'Workspace management operations')
    .addTag('iam-groups', 'Group management operations')
    .addTag('iam-regions', 'Region management operations')
    .addTag('iam-audit', 'Audit log operations')
    .addServer('http://localhost:3000', 'Development')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger UI: http://localhost:${port}/api`);
  console.log(`OpenTelemetry: ${process.env.OTEL_ENABLED === 'true' ? 'Enabled' : 'Disabled'}`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.warn('SIGTERM signal received: closing HTTP server');
    await app.close();
  });

  process.on('SIGINT', async () => {
    console.warn('SIGINT signal received: closing HTTP server');
    await app.close();
  });
}

bootstrap().catch(err => {
  console.error('[Bootstrap] Failed to start application:', err);
  process.exit(1);
});
