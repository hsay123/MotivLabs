/**
 * Integration boundary.
 * -------------------------------------------------------------------
 * This repository currently ships the **frontend only**. There is no
 * backend, database or authentication service wired up, so nothing here
 * invents server behaviour.
 *
 * Every product screen reads through this module. It exposes:
 *
 *   • `apiConfig`          — how the boundary is configured.
 *   • `endpoints`          — the HTTP contract the UI is written against.
 *   • `request()`          — a typed fetch wrapper for that contract.
 *   • `getDataSource()`    — resolves to the live API when configured, or
 *                            to the clearly-labelled sample fixtures used
 *                            for interface previews.
 *
 * When `NEXT_PUBLIC_API_BASE_URL` is set, `request()` calls the real
 * service and sample fixtures are never used. When it is unset, the UI
 * renders preview state and every screen that shows it says so.
 */

import type {
  ExportPackage,
  Job,
  ProvenanceReceipt,
  QualityMetric,
  Role,
  Task,
} from "./types";

export type ApiErrorCode =
  | "NOT_CONFIGURED"
  | "NETWORK"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "SERVER";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  status?: number;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? null,
  /** Documented for operators; the UI never reads a bearer token client-side. */
  authModel: "Server-side session cookie issued by the platform API.",
} as const;

export const isApiConfigured = (): boolean => apiConfig.baseUrl !== null;

/**
 * The HTTP surface the UI expects. Kept in one place so the contract can
 * be reviewed alongside the screens that depend on it. Authorization,
 * validation, rate limiting and idempotency are the server's
 * responsibility and are not implemented client-side.
 */
export const endpoints = {
  createJob: () => `/api/jobs`,
  publishJob: (jobId: string) => `/api/jobs/${jobId}/publish`,
  job: (jobId: string) => `/api/jobs/${jobId}`,
  jobExport: (jobId: string) => `/api/jobs/${jobId}/export`,
  availableTasks: () => `/api/tasks/available`,
  claimTask: (taskId: string) => `/api/tasks/${taskId}/claim`,
  saveDraft: (taskId: string) => `/api/tasks/${taskId}/draft`,
  submitTask: (taskId: string) => `/api/tasks/${taskId}/submit`,
  reviewDecision: (submissionId: string) =>
    `/api/reviews/${submissionId}/decision`,
  appeal: (submissionId: string) => `/api/submissions/${submissionId}/appeal`,
  settlementBatch: () => `/api/settlement/batches`,
  receipt: (receiptId: string) => `/api/receipts/${receiptId}`,
} as const;

/** POST /api/contact — the one endpoint the marketing site needs. */
export const contactEndpoint = "/api/contact";

export async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  if (!apiConfig.baseUrl) {
    return {
      ok: false,
      error: {
        code: "NOT_CONFIGURED",
        message:
          "No platform API is configured. Set NEXT_PUBLIC_API_BASE_URL to connect the application.",
      },
    };
  }

  try {
    const response = await fetch(new URL(path, apiConfig.baseUrl), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const code: ApiErrorCode =
        response.status === 401
          ? "UNAUTHORIZED"
          : response.status === 403
            ? "FORBIDDEN"
            : response.status === 404
              ? "NOT_FOUND"
              : response.status === 422
                ? "VALIDATION"
                : "SERVER";
      return {
        ok: false,
        error: {
          code,
          status: response.status,
          message: `${response.status} ${response.statusText}`,
        },
      };
    }

    return { ok: true, data: (await response.json()) as T };
  } catch (cause) {
    return {
      ok: false,
      error: {
        code: "NETWORK",
        message:
          cause instanceof Error ? cause.message : "Network request failed.",
      },
    };
  }
}

/**
 * What a product screen should render right now.
 *
 * `"live"`    — a platform API is configured; screens call `request()`.
 * `"preview"` — no API is configured; screens render sample fixtures and
 *               label them as such. This is the current state.
 */
export type DataSource = "live" | "preview";

export const getDataSource = (): DataSource =>
  isApiConfigured() ? "live" : "preview";

export const previewNotice =
  "Interface preview — sample records are shown because no platform API is connected.";

/* ---- Typed reads used by the product screens ----------------------- */

export type TaskQuery = { role: Role; eligibleOnly?: boolean };

export type ApiSurface = {
  listJobs(): Promise<ApiResult<Job[]>>;
  getJob(jobId: string): Promise<ApiResult<Job>>;
  listTasks(query: TaskQuery): Promise<ApiResult<Task[]>>;
  getTask(taskId: string): Promise<ApiResult<Task>>;
  listReviewQueue(): Promise<ApiResult<Task[]>>;
  listExports(): Promise<ApiResult<ExportPackage[]>>;
  getQualityMetrics(jobId: string): Promise<ApiResult<QualityMetric[]>>;
  getReceipts(): Promise<ApiResult<ProvenanceReceipt[]>>;
};

export const createApiSurface = (base = endpoints): ApiSurface => ({
  listJobs: () => request<Job[]>(`/api/jobs`),
  getJob: (jobId) => request<Job>(base.job(jobId)),
  listTasks: (query) =>
    request<Task[]>(
      `${base.availableTasks()}?role=${encodeURIComponent(query.role)}${
        query.eligibleOnly ? "&eligible=true" : ""
      }`,
    ),
  getTask: (taskId) => request<Task>(`/api/tasks/${taskId}`),
  listReviewQueue: () => request<Task[]>(`/api/reviews/queue`),
  listExports: () => request<ExportPackage[]>(`/api/exports`),
  getQualityMetrics: (jobId) =>
    request<QualityMetric[]>(`/api/jobs/${jobId}/quality`),
  getReceipts: () => request<ProvenanceReceipt[]>(`/api/receipts`),
});
