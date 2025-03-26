import prometheus from "prom-client";

export class MetricsService {
  private jobsCompletedCounter: prometheus.Counter;
  private jobsFailedCounter: prometheus.Counter;

  constructor() {
    prometheus.collectDefaultMetrics();

    this.jobsCompletedCounter = new prometheus.Counter({
      name: "jobs_completed_total",
      help: "Total number of completed jobs",
    });

    this.jobsFailedCounter = new prometheus.Counter({
      name: "jobs_failed_total",
      help: "Total number of failed jobs",
    });
  }

  incrementCompletedJobs() {
    this.jobsCompletedCounter.inc();
  }

  incrementFailedJobs() {
    this.jobsFailedCounter.inc();
  }
}
