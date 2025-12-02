import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';

@ApiTags('Health')
@Controller()
export class HealthController {
  private appVersion: string;
  private buildTime: string;

  constructor() {
    try {
      const packageJson = JSON.parse(
        readFileSync(join(__dirname, '../../package.json'), 'utf8')
      );
      this.appVersion = packageJson.version || '1.0.0';
      this.buildTime = new Date().toISOString();
    } catch (error) {
      this.appVersion = '1.0.0';
      this.buildTime = new Date().toISOString();
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'System health status' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'telemetryflow-core',
      version: this.appVersion,
    };
  }

  @Get('version')
  @ApiOperation({ summary: 'Version and build information' })
  @ApiResponse({ status: 200, description: 'Version information' })
  getVersion() {
    return {
      version: this.appVersion,
      buildTime: this.buildTime,
      service: 'TelemetryFlow Core',
      description: 'IAM Module with 5-Tier RBAC',
      author: 'DevOpsCorner Indonesia',
      license: 'Apache-2.0',
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'OTEL metrics export info' })
  @ApiResponse({ status: 200, description: 'Metrics export information' })
  metrics() {
    return {
      status: 'ok',
      message: 'Metrics are exported to OTEL Collector',
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    };
  }
}

