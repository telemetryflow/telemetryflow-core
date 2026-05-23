/**
 * Queue Configuration
 * Defines configuration for BullMQ queues
 */

import { QueueOptions, WorkerOptions } from "bullmq";

export interface QueueConfig {
  /** Redis connection configuration */
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    maxRetriesPerRequest: null;
  };
  /** Default queue options */
  defaultQueueOptions: Partial<QueueOptions>;
  /** Default worker options */
  defaultWorkerOptions: Partial<WorkerOptions>;
  /** Queue-specific configurations */
  queues: {
    "otlp-ingestion": QueueSpecificConfig;
    "domain-events": QueueSpecificConfig;
    "telemetry-processing": QueueSpecificConfig;
    alerts: QueueSpecificConfig;
    notifications: QueueSpecificConfig;
  };
}

export interface QueueSpecificConfig {
  /** Worker concurrency */
  concurrency: number;
  /** Default job options */
  defaultJobOptions: {
    attempts: number;
    backoff: {
      type: "fixed" | "exponential";
      delay: number;
    };
    removeOnComplete: boolean | number | { count: number; age: number };
    removeOnFail: boolean | number | { count: number; age: number };
  };
}

export const getQueueConfig = (): QueueConfig => ({
  redis: {
    host:
      process.env.BULLMQ_REDIS_HOST || process.env.REDIS_HOST || "localhost",
    port: parseInt(
      process.env.BULLMQ_REDIS_PORT || process.env.REDIS_PORT || "6379",
      10,
    ),
    password:
      process.env.BULLMQ_REDIS_PASSWORD ||
      process.env.REDIS_PASSWORD ||
      undefined,
    db: parseInt(process.env.BULLMQ_REDIS_DB || "0", 10), // redis-master is dedicated to BullMQ; cacheRedis is a separate instance
    maxRetriesPerRequest: null, // BullMQ requires null for blocking commands
  },
  defaultQueueOptions: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
      removeOnComplete: { count: 100, age: 3600 }, // Keep last 100 OR 1h, whichever is less
      removeOnFail: { count: 50, age: 86400 }, // Keep last 50 failures OR 24h for debugging
    },
  },
  defaultWorkerOptions: {
    concurrency: parseInt(process.env.BULLMQ_CONCURRENCY || "5", 10),
    limiter: {
      max: 100,
      duration: 1000, // 100 jobs per second
    },
  },
  queues: {
    "otlp-ingestion": {
      concurrency: parseInt(process.env.QUEUE_OTLP_CONCURRENCY || "10", 10),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 500 },
        removeOnComplete: { count: 100, age: 300 }, // High-volume: keep 100 OR 5min
        removeOnFail: { count: 50, age: 3600 }, // Keep 50 failures OR 1h
      },
    },
    "domain-events": {
      concurrency: parseInt(process.env.QUEUE_EVENTS_CONCURRENCY || "5", 10),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: { count: 200, age: 1800 }, // Keep 200 OR 30min
        removeOnFail: { count: 100, age: 86400 }, // Keep 100 failures OR 24h
      },
    },
    "telemetry-processing": {
      concurrency: parseInt(
        process.env.QUEUE_TELEMETRY_CONCURRENCY || "10",
        10,
      ),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 500 },
        removeOnComplete: { count: 100, age: 300 }, // High-volume: keep 100 OR 5min
        removeOnFail: { count: 50, age: 3600 }, // Keep 50 failures OR 1h
      },
    },
    alerts: {
      concurrency: parseInt(process.env.QUEUE_ALERTS_CONCURRENCY || "5", 10),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "fixed", delay: 5000 },
        removeOnComplete: { count: 500, age: 86400 }, // Keep 500 OR 24h (alerts need audit trail)
        removeOnFail: { count: 200, age: 604800 }, // Keep 200 OR 7d (alert failures important)
      },
    },
    notifications: {
      concurrency: parseInt(
        process.env.QUEUE_NOTIFICATIONS_CONCURRENCY || "3",
        10,
      ),
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 200, age: 86400 }, // Keep 200 OR 24h
        removeOnFail: { count: 100, age: 604800 }, // Keep 100 OR 7d
      },
    },
  },
});

export const QUEUE_CONFIG = Symbol("QUEUE_CONFIG");
