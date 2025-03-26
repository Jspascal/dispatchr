import cluster from "cluster";
import os from "os";
import { QueueManager } from "../queues/queue-manager";
import { logger } from "../utils/logger";

export class WorkerPool {
  private static instance: WorkerPool;
  private queueManager: QueueManager;
  private workers: cluster.Worker[] = [];

  private constructor(redisUrl: string, workerCount?: number) {
    this.queueManager = new QueueManager(redisUrl);
    this.initializeWorkers(workerCount);
  }

  public static getInstance(redisUrl: string, workerCount?: number) {
    if (!this.instance) {
      this.instance = new WorkerPool(redisUrl, workerCount);
    }
    return this.instance;
  }

  private initializeWorkers(workerCount = os.cpus().length) {
    if (cluster.isPrimary) {
      logger.info(`Primary ${process.pid} is running`);

      for (let i = 0; i < workerCount; i++) {
        const worker = cluster.fork();
        this.workers.push(worker);
      }

      cluster.on("exit", (worker, code, signal) => {
        logger.warn(`Worker ${worker.process.pid} died`);
        // Replace dead worker
        const newWorker = cluster.fork();
        this.workers = this.workers.filter((w) => w.id !== worker.id);
        this.workers.push(newWorker);
      });
    }
  }
}
