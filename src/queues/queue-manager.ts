import Bull from "bull";
import { Redis } from "ioredis";
import { Job, JobPriority, JobStatus } from "../types/job";
import { logger } from "../utils/logger";
import { MetricsService } from "../services/metrics-service";

export class QueueManager {
  private queues: Record<string, Bull.Queue> = {};
  private redisClient: Redis;
  private metricsService: MetricsService;

  constructor(public redisUrl: string) {
    this.redisClient = new Redis(redisUrl);
    this.metricsService = new MetricsService();
  }

  public createQueue(name: string, options?: Bull.QueueOptions) {
    const queue = new Bull(name, {
      redis: this.redisUrl,
      settings: {
        lockDuration: 30000,
        stalledInterval: 30000,
        maxStalledCount: 3,
      },
      ...options,
    });

    this.queues[name] = queue;
    this.setupQueueMetrics(queue);
    return queue;
  }

  private setupQueueMetrics(queue: Bull.Queue) {
    queue.on("completed", (job) => {
      this.metricsService.incrementCompletedJobs();
    });

    queue.on("failed", (job, err) => {
      this.metricsService.incrementFailedJobs();
      logger.error(`Job ${job.id} failed: ${err}`);
    });
  }

  public async addJob<T>(
    queueName: string,
    jobData: T,
    options: {
      priority?: JobPriority;
      delay?: number;
      attempts?: number;
    } = {}
  ) {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(jobData, {
      priority: options.priority || JobPriority.MEDIUM,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });
  }
}
