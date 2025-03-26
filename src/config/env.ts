import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  REDIS_URL: z.string().url("Invalid Redis URL"),
  WORKER_CONCURRENCY: z.string().transform(Number).default("4"),
  MAX_JOB_RETRIES: z.string().transform(Number).default("3"),
  PROMETHEUS_ENDPOINT: z.string().default("/metrics"),
});

export const env = EnvSchema.parse(process.env);

export enum JobPriority {
  LOW = 1,
  MEDIUM = 5,
  HIGH = 10,
  CRITICAL = 20,
}

export enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  DELAYED = "delayed",
}

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  createdAt: Date;
  attempts: number;
  maxRetries: number;
}
