import { randomUUID } from "node:crypto";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job<T = unknown> {
  id: string;
  payload: T;
  status: JobStatus;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
  lastError?: string;
}

export function createJob<T>(payload: T): Job<T> {
  const now = new Date();
  return {
    id: randomUUID(),
    payload,
    status: "pending",
    attempts: 0,
    createdAt: now,
    updatedAt: now,
  };
}
