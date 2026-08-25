import type { Job } from "./job.js";
import type { Queue } from "./queue.js";

export type Handler<T> = (job: Job<T>) => void | Promise<void>;

export interface WorkerOptions {
  pollIntervalMs?: number;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export class Worker<T = unknown> {
  private running = false;
  private loop?: Promise<void>;
  private pollIntervalMs: number;

  constructor(
    private queue: Queue<T>,
    private handler: Handler<T>,
    options: WorkerOptions = {},
  ) {
    this.pollIntervalMs = options.pollIntervalMs ?? 100;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.loop = this.run();
  }

  async stop(): Promise<void> {
    this.running = false;
    await this.loop;
  }

  private async run(): Promise<void> {
    while (this.running) {
      const job = this.queue.claim();
      if (!job) {
        await sleep(this.pollIntervalMs);
        continue;
      }
      try {
        await this.handler(job);
        this.queue.complete(job);
      } catch (err) {
        this.queue.fail(job, err);
      }
    }
  }
}
