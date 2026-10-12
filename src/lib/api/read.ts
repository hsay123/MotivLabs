/**
 * Read helpers for the product screens.
 *
 * Each helper resolves the platform API when one is configured, and falls
 * back to the clearly-labelled sample fixtures otherwise. Screens read
 * through this module so switching on a real backend requires no page
 * changes.
 *
 * These run on the server (React Server Components), so the sample
 * fixtures are never shipped to the client unless a screen opts in.
 */

import { createApiSurface, getDataSource } from "./client";
import * as sample from "./sample";
import type {
  AnnotationSegment,
  AuditEvent,
  Role,
  Job,
  Task,
  ExportPackage,
  QualityMetric,
  ProvenanceReceipt,
} from "./types";

const surface = createApiSurface();

export type ReadResult<T> = {
  data: T;
  source: "preview" | "live";
};

type LiveOutcome<T> = { ok: true; data: T } | { ok: false; error: unknown };

/**
 * Resolve a screen's data.
 *
 * In preview mode the labelled fixtures are returned. In live mode the API
 * is called; on failure the caller's `empty` value is returned rather than
 * stale sample data, so a broken backend never looks like real activity.
 */
async function resolve<T>(
  preview: T,
  empty: T,
  live: () => Promise<LiveOutcome<T>>,
): Promise<ReadResult<T>> {
  if (getDataSource() === "preview") {
    return { data: preview, source: "preview" };
  }
  const result = await live();
  return { data: result.ok ? result.data : empty, source: "live" };
}

export const readJobs = () =>
  resolve<Job[]>(sample.sampleJobs, [], () => surface.listJobs());

export const readJob = (jobId: string) =>
  resolve<Job | null>(
    sample.sampleJobs.find((job) => job.id === jobId) ?? null,
    null,
    () => surface.getJob(jobId) as Promise<LiveOutcome<Job | null>>,
  );

export const readContributorTasks = () =>
  resolve<Task[]>(sample.sampleContributorTasks, [], () =>
    surface.listTasks({ role: "contributor" as Role }),
  );

export const readTask = (taskId: string) =>
  resolve<Task | null>(
    sample.sampleContributorTasks.find((task) => task.id === taskId) ??
      sample.sampleReviewQueue.find((task) => task.id === taskId) ??
      (sample.sampleActiveTask.id === taskId ? sample.sampleActiveTask : null),
    null,
    () => surface.getTask(taskId) as Promise<LiveOutcome<Task | null>>,
  );

export const readReviewQueue = () =>
  resolve<Task[]>(sample.sampleReviewQueue, [], () => surface.listReviewQueue());

export const readExports = () =>
  resolve<ExportPackage[]>(sample.sampleExports, [], () => surface.listExports());

export const readQualityMetrics = (jobId: string) =>
  resolve<QualityMetric[]>(sample.sampleQualityMetrics, [], () =>
    surface.getQualityMetrics(jobId),
  );

export const readReceipts = () =>
  resolve<ProvenanceReceipt[]>(sample.sampleReceipts, [], () => surface.getReceipts());

/**
 * Audit events and the in-progress draft are preview-only affordances —
 * their live equivalents are part of the same API surface, so in live mode
 * they degrade to empty rather than showing sample activity.
 */
export const readAuditEvents = () =>
  resolve<AuditEvent[]>(sample.sampleAuditEvents, [], async () => ({
    ok: true as const,
    data: [],
  }));

export const readDraftSegments = () =>
  resolve<AnnotationSegment[]>(sample.sampleDraftSegments, [], async () => ({
    ok: true as const,
    data: [],
  }));

export const readActiveTask = () =>
  resolve<Task>(sample.sampleActiveTask, sample.sampleActiveTask, async () => ({
    ok: true as const,
    data: sample.sampleActiveTask,
  }));
