import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { AuditService, AuditEventResult } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, headers } = request;
    const user = (request as any).user;

    return next.handle().pipe(
      tap(() => {
        this.auditService.logData(
          `${method} ${url}`,
          AuditEventResult.SUCCESS,
          {
            userId: user?.id,
            userEmail: user?.email,
            resource: url,
            ipAddress: ip,
            userAgent: headers['user-agent'],
            tenantId: user?.tenantId,
            organizationId: user?.organizationId,
          },
        );
      }),
      catchError((error) => {
        this.auditService.logData(
          `${method} ${url}`,
          AuditEventResult.FAILURE,
          {
            userId: user?.id,
            userEmail: user?.email,
            resource: url,
            ipAddress: ip,
            userAgent: headers['user-agent'],
            errorMessage: error.message,
            tenantId: user?.tenantId,
            organizationId: user?.organizationId,
          },
        );
        throw error;
      }),
    );
  }
}
