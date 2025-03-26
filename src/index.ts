import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env";
import { apiRateLimiter } from "./middleware/rate-limiter";
import { WorkerPool } from "./services/worker-pool";
import { logger } from "./utils/logger";
import promBundle from "express-prom-bundle";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);

const metricsMiddleware = promBundle({
  includePath: true,
  includeMethod: true,
  customLabels: { project_name: "dispatchr" },
  buckets: [0.1, 0.5, 1, 1.5],
  metricsPath: env.PROMETHEUS_ENDPOINT,
});

app.use(metricsMiddleware);

const workerPool = WorkerPool.getInstance(
  env.REDIS_URL,
  env.WORKER_CONCURRENCY
);

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully");

  process.exit(0);
});
