import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { QueueService } from "./queue.service";
import {
  QueueName,
  QUEUE_NAMES,
  QueueStats,
} from "./interfaces/queue.interface";

/**
 * Queue Admin Controller
 * Provides endpoints for queue management and monitoring
 *
 * Base path: /admin/queues
 */
@Controller("admin/queues")
export class QueueAdminController {
  constructor(private readonly queueService: QueueService) {}

  /**
   * Get all queues statistics
   * GET /admin/queues/stats
   */
  @Get("stats")
  async getAllStats(): Promise<{
    queues: QueueStats[];
    total: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
    };
  }> {
    const queues = await this.queueService.getAllStats();

    const total = queues.reduce(
      (acc, q) => ({
        waiting: acc.waiting + q.waiting,
        active: acc.active + q.active,
        completed: acc.completed + q.completed,
        failed: acc.failed + q.failed,
      }),
      { waiting: 0, active: 0, completed: 0, failed: 0 },
    );

    return { queues, total };
  }

  /**
   * Get specific queue statistics
   * GET /admin/queues/:queueName/stats
   */
  @Get(":queueName/stats")
  async getQueueStats(
    @Param("queueName") queueName: string,
  ): Promise<QueueStats> {
    this.validateQueueName(queueName);
    return this.queueService.getStats(queueName as QueueName);
  }

  /**
   * Get queue health status
   * GET /admin/queues/health
   */
  @Get("health")
  async getHealth(): Promise<{
    status: string;
    healthy: boolean;
    queues: string[];
  }> {
    const healthy = await this.queueService.isHealthy();

    return {
      status: healthy ? "healthy" : "unhealthy",
      healthy,
      queues: Object.values(QUEUE_NAMES),
    };
  }

  /**
   * Pause a queue
   * POST /admin/queues/:queueName/pause
   */
  @Post(":queueName/pause")
  @HttpCode(HttpStatus.OK)
  async pauseQueue(
    @Param("queueName") queueName: string,
  ): Promise<{ success: boolean; message: string }> {
    this.validateQueueName(queueName);
    await this.queueService.pause(queueName as QueueName);

    return {
      success: true,
      message: `Queue '${queueName}' paused`,
    };
  }

  /**
   * Resume a queue
   * POST /admin/queues/:queueName/resume
   */
  @Post(":queueName/resume")
  @HttpCode(HttpStatus.OK)
  async resumeQueue(
    @Param("queueName") queueName: string,
  ): Promise<{ success: boolean; message: string }> {
    this.validateQueueName(queueName);
    await this.queueService.resume(queueName as QueueName);

    return {
      success: true,
      message: `Queue '${queueName}' resumed`,
    };
  }

  /**
   * Clean completed/failed jobs from a queue
   * POST /admin/queues/:queueName/clean
   * Query params:
   *   - status: 'completed' | 'failed' (default: 'completed')
   *   - grace: Grace period in milliseconds (default: 3600000 = 1 hour)
   */
  @Post(":queueName/clean")
  @HttpCode(HttpStatus.OK)
  async cleanQueue(
    @Param("queueName") queueName: string,
    @Query("status") status?: "completed" | "failed",
    @Query("grace") grace?: string,
  ): Promise<{ success: boolean; removed: number }> {
    this.validateQueueName(queueName);

    const jobStatus = status || "completed";
    const graceMs = parseInt(grace || "3600000", 10);

    const removed = await this.queueService.clean(
      queueName as QueueName,
      graceMs,
      jobStatus,
    );

    return {
      success: true,
      removed,
    };
  }

  /**
   * Drain a queue (remove all jobs)
   * DELETE /admin/queues/:queueName/drain
   */
  @Delete(":queueName/drain")
  async drainQueue(
    @Param("queueName") queueName: string,
  ): Promise<{ success: boolean; message: string }> {
    this.validateQueueName(queueName);
    await this.queueService.drain(queueName as QueueName);

    return {
      success: true,
      message: `Queue '${queueName}' drained`,
    };
  }

  /**
   * List all available queue names
   * GET /admin/queues/list
   */
  @Get("list")
  listQueues(): { queues: string[] } {
    return {
      queues: Object.values(QUEUE_NAMES),
    };
  }

  /**
   * Validate queue name
   */
  private validateQueueName(queueName: string): void {
    const validQueues = Object.values(QUEUE_NAMES);
    if (!validQueues.includes(queueName as QueueName)) {
      throw new BadRequestException(
        `Invalid queue name '${queueName}'. Valid queues: ${validQueues.join(", ")}`,
      );
    }
  }
}
