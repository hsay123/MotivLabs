/**
 * PhysicalData platform client (real backend contract).
 * -------------------------------------------------------------------
 * One typed HTTP client for the Next.js API in `backend/`. Every response is
 * parsed with a zod schema at this boundary, so screens never trust unvalidated
 * JSON. Base URL comes from `NEXT_PUBLIC_API_BASE_URL`; the bearer token is
 * supplied by `getToken` (a Privy access token in the running app).
 *
 * This module is the live contract. The older `client.ts` sample/preview layer
 * is kept only for the unconnected interface preview and is never used when a
 * base URL is configured.
 */

import { z } from "zod";

// ---------------------------------------------------------------- schemas

export const userRoleSchema = z.enum(["buyer", "contributor", "reviewer", "admin"]);
export const userStatusSchema = z.enum(["active", "suspended"]);
export const modalitySchema = z.enum(["image", "video"]);
export const jobStatusSchema = z.enum(["draft", "published", "paused", "closed"]);
export const taskStatusSchema = z.enum([
  "available",
  "claimed",
  "draft",
  "submitted",
  "needs_revision",
  "accepted",
  "rejected",
  "appealed",
  "paid",
]);
export const reviewerTypeSchema = z.enum(["code", "ai", "human"]);
export const decisionSchema = z.enum(["accept", "revise", "reject"]);
export const appealStatusSchema = z.enum(["open", "accepted", "rejected"]);

export const meProfileSchema = z.object({
  qualification_passed: z.boolean(),
  tasks_completed: z.number(),
  gold_accuracy: z.number().nullable(),
});

export const currentUserSchema = z.object({
  id: z.string(),
  wallet_address: z.string().nullable(),
  email: z.string().nullable(),
  role: userRoleSchema,
  status: userStatusSchema,
  created_at: z.string(),
  profile: meProfileSchema.nullable(),
});

export const projectSchema = z.object({
  id: z.string(),
  buyer_id: z.string(),
  name: z.string(),
  data_rights: z.string().nullable(),
  retention_policy: z.string().nullable(),
  created_at: z.string(),
});

export const assetSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  content_hash: z.string(),
  modality: modalitySchema,
  duration_ms: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  consent_ref: z.string().nullable(),
});

export const jobSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  schema_version_id: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  modality: modalitySchema,
  reward_per_task: z.string(),
  budget: z.string(),
  deadline: z.string().nullable(),
  policy_hash: z.string().nullable(),
  rubric: z.record(z.string(), z.unknown()).nullable(),
  status: jobStatusSchema,
  chain_job_id: z.string().nullable(),
  label_list: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export const taskSchema = z.object({
  id: z.string(),
  job_id: z.string(),
  asset_id: z.string(),
  modality: modalitySchema,
  status: taskStatusSchema,
  is_gold: z.boolean(),
  lease_owner: z.string().nullable(),
  lease_expiry: z.string().nullable(),
  signed_media_url: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const claimResultSchema = z.object({
  task_id: z.string(),
  lease_expiry: z.string(),
  signed_media_url: z.string(),
});

export const draftSaveResultSchema = z.object({
  task_id: z.string(),
  saved_at: z.string(),
});

export const receiptSchema = z.object({
  id: z.string(),
  submission_id: z.string(),
  annotation_hash: z.string(),
  policy_hash: z.string(),
  review_ref: z.string().nullable(),
  tx_hash: z.string().nullable(),
  is_mock: z.boolean(),
  created_at: z.string(),
});

export const earningsSummarySchema = z.object({
  total_accepted: z.number(),
  total_paid: z.string(),
  total_pending: z.string(),
  tasks: z.array(
    z.object({
      task_id: z.string(),
      job_title: z.string(),
      status: taskStatusSchema,
      reward: z.string(),
      submitted_at: z.string(),
      tx_hash: z.string().nullable(),
    }),
  ),
});

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    per_page: z.number(),
  });
}

export type CurrentUser = z.infer<typeof currentUserSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Asset = z.infer<typeof assetSchema>;
export type Job = z.infer<typeof jobSchema>;
export type Task = z.infer<typeof taskSchema>;
export type ClaimResult = z.infer<typeof claimResultSchema>;
export type Receipt = z.infer<typeof receiptSchema>;
export type EarningsSummary = z.infer<typeof earningsSummarySchema>;

// ---------------------------------------------------------------- client

export type PlatformErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "RATE_LIMIT"
  | "SERVER"
  | "NETWORK"
  | "OFFLINE";

export class PlatformError extends Error {
  readonly code: PlatformErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(code: PlatformErrorCode, message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "PlatformError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export type TokenProvider = () => Promise<string | null> | string | null;

export interface PlatformClientOptions {
  baseUrl: string;
  getToken?: TokenProvider;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Adds an `Idempotency-Key` header (claim/draft/submit/accept/decision/appeal). */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

const ERROR_CODES: Record<number, PlatformErrorCode> = {
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "VALIDATION",
  429: "RATE_LIMIT",
};

export class PlatformClient {
  private readonly appBase: string;
  private readonly getToken?: TokenProvider;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;

  constructor(opts: PlatformClientOptions) {
    this.appBase = opts.baseUrl.replace(/\/$/, "");
    this.getToken = opts.getToken;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.timeoutMs = opts.timeoutMs ?? 15_000;
  }

  async request<T>(schema: z.ZodType<T>, path: string, opts: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const signal = opts.signal ?? controller.signal;

    const headers: Record<string, string> = { "content-type": "application/json" };
    if (opts.idempotencyKey) headers["idempotency-key"] = opts.idempotencyKey;
    if (this.getToken) {
      const token = await this.getToken();
      if (token) headers.authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.appBase}${path}`, {
        method: opts.method ?? "GET",
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        cache: "no-store",
        signal,
      });
    } catch (cause) {
      throw new PlatformError(
        "NETWORK",
        cause instanceof Error ? cause.message : "Network request failed",
      );
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    const parsedBody = raw ? safeJson(raw) : null;

    if (!response.ok) {
      const code = ERROR_CODES[response.status] ?? "SERVER";
      const message =
        (parsedBody as { error?: { message?: string } } | null)?.error?.message ??
        `${response.status} ${response.statusText}`;
      const details = (parsedBody as { error?: { details?: unknown } } | null)?.error?.details;
      throw new PlatformError(code, message, response.status, details);
    }

    const envelope = parsedBody as { data?: unknown } | null;
    const result = schema.safeParse(envelope?.data);
    if (!result.success) {
      throw new PlatformError("SERVER", "Response did not match the expected shape", response.status, result.error.issues);
    }
    return result.data;
  }

  get<T>(schema: z.ZodType<T>, path: string, opts?: RequestOptions) {
    return this.request(schema, path, { ...opts, method: "GET" });
  }
  post<T>(schema: z.ZodType<T>, path: string, opts?: RequestOptions) {
    return this.request(schema, path, { ...opts, method: "POST" });
  }
  put<T>(schema: z.ZodType<T>, path: string, opts?: RequestOptions) {
    return this.request(schema, path, { ...opts, method: "PUT" });
  }
  patch<T>(schema: z.ZodType<T>, path: string, opts?: RequestOptions) {
    return this.request(schema, path, { ...opts, method: "PATCH" });
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Path builders for the real backend, in one place. */
export const platformPaths = {
  me: () => "/api/me",
  health: () => "/api/health",
  projects: () => "/api/projects",
  uploadUrl: () => "/api/assets/upload-url",
  assets: () => "/api/assets",
  jobs: () => "/api/jobs",
  job: (id: string) => `/api/jobs/${id}`,
  publishJob: (id: string) => `/api/jobs/${id}/publish`,
  pauseJob: (id: string) => `/api/jobs/${id}/pause`,
  resumeJob: (id: string) => `/api/jobs/${id}/resume`,
  closeJob: (id: string) => `/api/jobs/${id}/close`,
  jobTasks: (id: string) => `/api/jobs/${id}/tasks`,
  jobExport: (id: string) => `/api/jobs/${id}/export`,
  availableTasks: () => "/api/tasks/available",
  task: (id: string) => `/api/tasks/${id}`,
  claimTask: (id: string) => `/api/tasks/${id}/claim`,
  saveDraft: (id: string) => `/api/tasks/${id}/draft`,
  submitTask: (id: string) => `/api/tasks/${id}/submit`,
  reviewQueue: () => "/api/review/queue",
  appealsQueue: () => "/api/review/appeals/queue",
  reviewDecision: (submissionId: string) => `/api/reviews/${submissionId}/decision`,
  appeal: (submissionId: string) => `/api/submissions/${submissionId}/appeal`,
  appealDecision: (appealId: string) => `/api/appeals/${appealId}/decision`,
  settlementAccept: () => "/api/settlement/accept",
  receipt: (id: string) => `/api/receipts/${id}`,
  earnings: () => "/api/earnings",
} as const;

export const isPlatformConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

/** Create a client from the public env (throws if unconfigured). */
export function createPlatformClient(getToken?: TokenProvider): PlatformClient {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    throw new PlatformError(
      "OFFLINE",
      "NEXT_PUBLIC_API_BASE_URL is not set; the platform API is not configured.",
    );
  }
  return new PlatformClient({ baseUrl, getToken });
}
