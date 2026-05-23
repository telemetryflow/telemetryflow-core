/**
 * Queue Module Interfaces
 * Defines contracts for BullMQ job queues
 */

export const QUEUE_NAMES = {
  OTLP_INGESTION: "otlp-ingestion",
  DOMAIN_EVENTS: "domain-events",
  TELEMETRY_PROCESSING: "telemetry-processing",
  ALERTS: "alerts",
  NOTIFICATIONS: "notifications",
  REPORTS: "reports",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface JobOptions {
  /** Job priority (1-10, lower is higher priority) */
  priority?: number;
  /** Delay in milliseconds before job is processed */
  delay?: number;
  /** Number of retry attempts */
  attempts?: number;
  /** Backoff strategy for retries */
  backoff?: {
    type: "fixed" | "exponential";
    delay: number;
  };
  /** Remove job on completion */
  removeOnComplete?: boolean | number;
  /** Remove job on failure */
  removeOnFail?: boolean | number;
  /** Job timeout in milliseconds */
  timeout?: number;
  /** Job ID (must be unique within queue) */
  jobId?: string;
}

export interface JobData {
  /** Job type identifier */
  type: string;
  /** Job payload */
  payload: Record<string, unknown>;
  /** Metadata */
  metadata?: {
    correlationId?: string;
    organizationId?: string;
    workspaceId?: string;
    tenantId?: string;
    timestamp?: string;
  };
}

export interface QueueStats {
  /** Queue name */
  name: string;
  /** Number of waiting jobs */
  waiting: number;
  /** Number of active jobs */
  active: number;
  /** Number of completed jobs */
  completed: number;
  /** Number of failed jobs */
  failed: number;
  /** Number of delayed jobs */
  delayed: number;
  /** Number of paused jobs */
  paused: number;
}

export interface IQueueService {
  /**
   * Add job to queue
   * @param queueName Queue name
   * @param data Job data
   * @param options Job options
   * @returns Job ID
   */
  addJob(
    queueName: QueueName,
    data: JobData,
    options?: JobOptions,
  ): Promise<string>;

  /**
   * Add multiple jobs to queue
   * @param queueName Queue name
   * @param jobs Array of job data and options
   * @returns Array of job IDs
   */
  addBulk(
    queueName: QueueName,
    jobs: Array<{ data: JobData; options?: JobOptions }>,
  ): Promise<string[]>;

  /**
   * Get queue statistics
   * @param queueName Queue name
   */
  getStats(queueName: QueueName): Promise<QueueStats>;

  /**
   * Get all queues statistics
   */
  getAllStats(): Promise<QueueStats[]>;

  /**
   * Pause queue
   * @param queueName Queue name
   */
  pause(queueName: QueueName): Promise<void>;

  /**
   * Resume queue
   * @param queueName Queue name
   */
  resume(queueName: QueueName): Promise<void>;

  /**
   * Clean completed/failed jobs
   * @param queueName Queue name
   * @param grace Grace period in milliseconds
   * @param status Job status to clean
   */
  clean(
    queueName: QueueName,
    grace: number,
    status: "completed" | "failed",
  ): Promise<number>;

  /**
   * Drain queue (remove all jobs)
   * @param queueName Queue name
   */
  drain(queueName: QueueName): Promise<void>;
}

export const QUEUE_SERVICE = Symbol("QUEUE_SERVICE");
