import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'TelemetryFlow Core',
      version: '1.0.0',
      description: 'Backend-only application with IAM module',
      endpoints: {
        api: '/api',
        health: '/health',
        version: '/version',
        metrics: '/metrics',
      },
    };
  }

  @Get('version')
  getVersion() {
    return {
      name: 'TelemetryFlow Core',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
