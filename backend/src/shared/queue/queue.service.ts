import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { Queue, Worker, Job, QueueEvents } from "bullmq";
import {
  IQueueService,
  QueueName,
  QUEUE_NAMES,
  JobData,
  JobOptions,
  QueueStats,
} from "./interfaces/queue.interface";
import { QueueConfig, getQueueConfig } from "./queue.config";

type ProcessorFunction = (job: Job<JobData>) => Promise<void>;

@Injectable()
export class QueueService
  implements IQueueService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(QueueService.name);
  private readonly config: QueueConfig;

  private queues: Map<QueueName, Queue<JobData>> = new Map();
  private workers: Map<QueueName, Worker<JobData>> = new Map();
  private queueEvents: Map<QueueName, QueueEvents> = new Map();
  private processors: Map<QueueName, ProcessorFunction> = new Map();

  constructor() {
    this.config = getQueueConfig();
  }

  async onModuleInit(): Promise<void> {
    const redisConnection = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
    };

    // Initialize all queues
    for (const queueName of Object.values(QUEUE_NAMES)) {
      try {
        // Create queue
        const queue = new Queue<JobData>(queueName, {
          connection: redisConnection,
          ...this.config.defaultQueueOptions,
          defaultJobOptions: {
            ...this.config.defaultQueueOptions.defaultJobOptions,
            ...this.config.queues[queueName]?.defaultJobOptions,
          },
        });

        this.queues.set(queueName, queue);

        // Create queue events for monitoring
        const queueEvents = new QueueEvents(queueName, {
          connection: redisConnection,
        });

        queueEvents.on("completed", ({ jobId }) => {
          this.logger.debug(`Job ${jobId} completed in queue ${queueName}`);
        });

        queueEvents.on("failed", ({ jobId, failedReason }) => {
          this.logger.error(
            `Job ${jobId} failed in queue ${queueName}: ${failedReason}`,
          );
        });

        this.queueEvents.set(queueName, queueEvents);

        this.logger.log(`Queue '${queueName}' initialized`);
      } catch (error) {
        this.logger.error(
          `Failed to initialize queue '${queueName}': ${error.message}`,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Close all workers
    for (const [name, worker] of this.workers.entries()) {
      try {
        await worker.close();
        this.logger.log(`Worker '${name}' closed`);
      } catch (error) {
        this.logger.error(`Failed to close worker '${name}': ${error.message}`);
      }
    }

    // Close all queue events
    for (const [name, events] of this.queueEvents.entries()) {
      try {
        await events.close();
      } catch (error) {
        this.logger.error(
          `Failed to close queue events '${name}': ${error.message}`,
        );
      }
    }

    // Close all queues
    for (const [name, queue] of this.queues.entries()) {
      try {
        await queue.close();
        this.logger.log(`Queue '${name}' closed`);
      } catch (error) {
        this.logger.error(`Failed to close queue '${name}': ${error.message}`);
      }
    }
  }

  /**
   * Register a processor for a queue
   * @param queueName Queue name
   * @param processor Processor function
   */
  registerProcessor(queueName: QueueName, processor: ProcessorFunction): void {
    this.processors.set(queueName, processor);

    const queue = this.queues.get(queueName);
    if (!queue) {
      this.logger.error(`Queue '${queueName}' not found`);
      return;
    }

    const queueConfig = this.config.queues[queueName];
    const redisConnection = {
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      db: this.config.redis.db,
      maxRetriesPerRequest: this.config.redis.maxRetriesPerRequest,
    };

    // Create worker
    const worker = new Worker<JobData>(
      queueName,
      async (job) => {
        this.logger.debug(`Processing job ${job.id} in queue ${queueName}`);
        await processor(job);
      },
      {
        connection: redisConnection,
        concurrency:
          queueConfig?.concurrency ||
          this.config.defaultWorkerOptions.concurrency,
        ...this.config.defaultWorkerOptions,
      },
    );

    worker.on("completed", (job) => {
      this.logger.debug(`Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });

    worker.on("error", (err) => {
      this.logger.error(`Worker error: ${err.message}`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker registered for queue '${queueName}'`);
  }

  async addJob(
    queueName: QueueName,
    data: JobData,
    options?: JobOptions,
  ): Promise<string> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    // Add timestamp if not provided
    if (!data.metadata) {
      data.metadata = {};
    }
    if (!data.metadata.timestamp) {
      data.metadata.timestamp = new Date().toISOString();
    }

    const jobOpts: Record<string, unknown> = {};
    if (options?.priority !== undefined) jobOpts.priority = options.priority;
    if (options?.delay !== undefined) jobOpts.delay = options.delay;
    if (options?.attempts !== undefined) jobOpts.attempts = options.attempts;
    if (options?.backoff !== undefined) jobOpts.backoff = options.backoff;
    if (options?.removeOnComplete !== undefined)
      jobOpts.removeOnComplete = options.removeOnComplete;
    if (options?.removeOnFail !== undefined)
      jobOpts.removeOnFail = options.removeOnFail;
    if (options?.jobId !== undefined) jobOpts.jobId = options.jobId;

    const job = await queue.add(data.type, data, jobOpts);

    this.logger.debug(`Job ${job.id} added to queue '${queueName}'`);
    return job.id!;
  }

  async addBulk(
    queueName: QueueName,
    jobs: Array<{ data: JobData; options?: JobOptions }>,
  ): Promise<string[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const bulkJobs = jobs.map(({ data, options }) => {
      const opts: Record<string, unknown> = {};
      if (options?.priority !== undefined) opts.priority = options.priority;
      if (options?.delay !== undefined) opts.delay = options.delay;
      if (options?.attempts !== undefined) opts.attempts = options.attempts;
      if (options?.backoff !== undefined) opts.backoff = options.backoff;
      if (options?.removeOnComplete !== undefined)
        opts.removeOnComplete = options.removeOnComplete;
      if (options?.removeOnFail !== undefined)
        opts.removeOnFail = options.removeOnFail;
      if (options?.jobId !== undefined) opts.jobId = options.jobId;
      return { name: data.type, data, opts };
    });

    const addedJobs = await queue.addBulk(bulkJobs);
    const jobIds = addedJobs.map((job) => job.id!);

    this.logger.debug(`${jobIds.length} jobs added to queue '${queueName}'`);
    return jobIds;
  }

  async getStats(queueName: QueueName): Promise<QueueStats> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);
    const paused = 0; // BullMQ Queue does not expose getPausedCount

    return {
      name: queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    };
  }

  async getAllStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];

    for (const queueName of this.queues.keys()) {
      try {
        const queueStats = await this.getStats(queueName);
        stats.push(queueStats);
      } catch (error) {
        this.logger.error(
          `Failed to get stats for queue '${queueName}': ${error.message}`,
        );
      }
    }

    return stats;
  }

  async pause(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.pause();
    this.logger.log(`Queue '${queueName}' paused`);
  }

  async resume(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.resume();
    this.logger.log(`Queue '${queueName}' resumed`);
  }

  async clean(
    queueName: QueueName,
    grace: number,
    status: "completed" | "failed",
  ): Promise<number> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    const removed = await queue.clean(grace, 100, status);
    this.logger.log(
      `Cleaned ${removed.length} ${status} jobs from queue '${queueName}'`,
    );
    return removed.length;
  }

  async drain(queueName: QueueName): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue '${queueName}' not found`);
    }

    await queue.drain();
    this.logger.log(`Queue '${queueName}' drained`);
  }

  /**
   * Check if queue service is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      for (const queue of this.queues.values()) {
        await queue.getWaitingCount();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get queue by name
   */
  getQueue(queueName: QueueName): Queue<JobData> | undefined {
    return this.queues.get(queueName);
  }
}
