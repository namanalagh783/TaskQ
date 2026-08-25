import { createJob, type Job } from "./job.js";

export class Queue<T = unknown> {
  private pending: Job<T>[] = [];
  private jobs = new Map<string, Job<T>>();

  constructor(readonly name: string) {}

  add(payload: T): Job<T> {
    const job = createJob(payload);
    this.jobs.set(job.id, job);
    this.pending.push(job);
    return job;
  }

  claim(): Job<T> | undefined {
    const job = this.pending.shift();
    if (!job) return undefined;
    job.status = "processing";
    job.attempts += 1;
    job.updatedAt = new Date();
    return job;
  }

  complete(job: Job<T>): void {
    const now = new Date();
    job.status = "completed";
    job.completedAt = now;
    job.updatedAt = now;
  }

  fail(job: Job<T>, error: unknown): void {
    const now = new Date();
    job.status = "failed";
    job.failedAt = now;
    job.updatedAt = now;
    job.lastError = error instanceof Error ? error.message : String(error);
  }

  get(id: string): Job<T> | undefined {
    return this.jobs.get(id);
  }

  size(): number {
    return this.pending.length;
  }
}
