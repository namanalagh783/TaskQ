# taskq

A layered job queue for Node.js. A single-process, in-memory queue and worker.

## Usage

```ts
import { Queue, Worker } from "taskq";

const queue = new Queue<{ to: string }>("emails");

const worker = new Worker(queue, async (job) => {
  await sendEmail(job.payload.to);
});

worker.start();
queue.add({ to: "a@example.com" });

// later
await worker.stop();
```

## Job lifecycle

`pending` -> `processing` -> `completed` or `failed`

A handler that throws marks the job `failed` and the worker moves on. There are no retries in v1.

## Limitations

- In-memory only: a crash loses every job.
- One worker per queue.
- Finished jobs are kept in memory and never evicted.
