import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { JobData } from '../interfaces/queue.interface';

/**
 * Base processor class for queue job processors
 * Provides common functionality for all processors
 */
export abstract class BaseProcessor {
  protected abstract readonly logger: Logger;
  protected abstract readonly processorName: string;

  /**
   * Process a job
   * @param job BullMQ job instance
   */
  abstract process(job: Job<JobData>): Promise<void>;

  /**
   * Handle job completion
   * @param job BullMQ job instance
   */
  protected onComplete(job: Job<JobData>): void {
    this.logger.debug(`[${this.processorName}] Job ${job.id} completed`, {
      type: job.data.type,
      duration: Date.now() - job.timestamp,
    });
  }

  /**
   * Handle job failure
   * @param job BullMQ job instance
   * @param error Error that caused the failure
   */
  protected onFailed(job: Job<JobData>, error: Error): void {
    this.logger.error(
      `[${this.processorName}] Job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Validate job data
   * @param job BullMQ job instance
   * @returns true if valid, throws error if invalid
   */
  protected validateJobData(job: Job<JobData>): boolean {
    if (!job.data) {
      throw new Error('Job data is missing');
    }
    if (!job.data.type) {
      throw new Error('Job type is missing');
    }
    if (!job.data.payload) {
      throw new Error('Job payload is missing');
    }
    return true;
  }

  /**
   * Extract correlation ID from job metadata
   * @param job BullMQ job instance
   */
  protected getCorrelationId(job: Job<JobData>): string {
    return job.data.metadata?.correlationId || job.id || 'unknown';
  }

  /**
   * Extract organization context from job metadata
   * @param job BullMQ job instance
   */
  protected getOrganizationContext(job: Job<JobData>): {
    organizationId?: string;
    workspaceId?: string;
    tenantId?: string;
  } {
    return {
      organizationId: job.data.metadata?.organizationId,
      workspaceId: job.data.metadata?.workspaceId,
      tenantId: job.data.metadata?.tenantId,
    };
  }
}
