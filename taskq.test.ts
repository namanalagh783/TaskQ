import { test } from "node:test";
import assert from "node:assert/strict";
import { Queue, Worker } from "./index.js";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitFor(condition: () => boolean, timeoutMs = 1000): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeoutMs) throw new Error("waitFor timed out");
    await sleep(5);
  }
}

test("runs jobs in the order they were added", async () => {
  const queue = new Queue<number>("numbers");
  const seen: number[] = [];
  const worker = new Worker(queue, (job) => {
    seen.push(job.payload);
  }, { pollIntervalMs: 5 });

  [1, 2, 3].forEach((n) => queue.add(n));
  worker.start();
  await waitFor(() => seen.length === 3);
  await worker.stop();

  assert.deepEqual(seen, [1, 2, 3]);
});

test("marks a successful job completed", async () => {
  const queue = new Queue<string>("emails");
  const worker = new Worker(queue, async () => {}, { pollIntervalMs: 5 });

  const job = queue.add("a@example.com");
  worker.start();
  await waitFor(() => queue.get(job.id)?.status === "completed");
  await worker.stop();

  const done = queue.get(job.id)!;
  assert.equal(done.attempts, 1);
  assert.ok(done.completedAt);
});

test("marks a throwing job failed and keeps processing", async () => {
  const queue = new Queue<string>("emails");
  const worker = new Worker(queue, (job) => {
    if (job.payload === "bad") throw new Error("boom");
  }, { pollIntervalMs: 5 });

  const bad = queue.add("bad");
  const good = queue.add("good");
  worker.start();
  await waitFor(() => queue.get(good.id)?.status === "completed");
  await worker.stop();

  const failed = queue.get(bad.id)!;
  assert.equal(failed.status, "failed");
  assert.equal(failed.lastError, "boom");
  assert.ok(failed.failedAt);
});

test("stop waits for the in-flight job to finish", async () => {
  const queue = new Queue<number>("slow");
  let started = false;
  const worker = new Worker(queue, async () => {
    started = true;
    await sleep(50);
  }, { pollIntervalMs: 5 });

  const job = queue.add(1);
  worker.start();
  await waitFor(() => started);
  await worker.stop();

  assert.equal(queue.get(job.id)?.status, "completed");
});
