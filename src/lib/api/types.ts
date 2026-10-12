/**
 * Domain types for the Motive Labs data-operations workflow.
 *
 * These mirror the entities defined in the product specification so the
 * UI is written against the real contract shape. They are deliberately
 * transport-agnostic: the same types would be returned by the HTTP API
 * described in `src/lib/api/client.ts`.
 */

export type Role = "buyer" | "contributor" | "reviewer";

/** Task lifecycle, from the specification's task state machine. */
export type TaskStatus =
  | "available"
  | "assigned"
  | "draft"
  | "submitted"
  | "validating"
  | "in_review"
  | "accepted"
  | "revision_requested"
  | "rejected"
  | "appealed"
  | "paid"
  | "payment_failed";

/** Payout lifecycle. Kept separate from task status on purpose. */
export type PayoutState =
  | "not_eligible"
  | "eligible"
  | "pending"
  | "submitted"
  | "confirmed"
  | "failed";

export type Outcome = "success" | "partial" | "failure" | "unknown";

export type FailureReason =
  | "slip"
  | "collision"
  | "occlusion"
  | "wrong_target"
  | "dropped_object"
  | "other";

export type ActionLabel =
  | "reach"
  | "grasp"
  | "lift"
  | "place"
  | "inspect"
  | "recover"
  | "other";

/** A single labeled interval on an asset timeline. */
export type AnnotationSegment = {
  startMs: number;
  endMs: number;
  actionLabel: ActionLabel;
  object?: string;
  outcome: Outcome;
  failureReason?: FailureReason;
  confidence: 1 | 2 | 3 | 4 | 5;
  notes?: string;
};

/** An immutable submitted version of a task's annotation. */
export type Submission = {
  id: string;
  taskId: string;
  version: number;
  submittedAt: string;
  schemaVersion: string;
  segments: AnnotationSegment[];
  validation: ValidationResult;
  reviewStatus: Extract<
    TaskStatus,
    "submitted" | "in_review" | "accepted" | "revision_requested" | "rejected" | "appealed"
  >;
};

export type ValidationIssue = {
  /** Field path the issue refers to, e.g. `segments[1].end_ms`. */
  path: string;
  message: string;
  /** `error` blocks acceptance; `warning` does not. */
  severity: "error" | "warning";
};

export type ValidationResult = {
  passed: boolean;
  issues: ValidationIssue[];
  checkedAt: string;
};

export type ReviewDecision = "accept" | "request_revision" | "reject" | "escalate";

export type Review = {
  id: string;
  submissionId: string;
  reviewerId: string;
  decision: ReviewDecision;
  reasonCode: string;
  notes?: string;
  rubricVersion: string;
  decidedAt: string;
};

export type Task = {
  id: string;
  jobId: string;
  assetId: string;
  /** Human-readable label for the clip, never a public media URL. */
  clipLabel: string;
  startMs: number;
  endMs: number;
  status: TaskStatus;
  rewardUsd: number;
  estimatedMinutes: number;
  schemaVersion: string;
  /** Declared difficulty, used for eligibility in the queue. */
  difficulty: "standard" | "advanced";
  deadline: string;
  leaseExpiresAt?: string;
  /** Present once the contributor has submitted. */
  latestSubmission?: Submission;
  review?: Review;
  payout: PayoutState;
};

export type Job = {
  id: string;
  projectId: string;
  title: string;
  modality: "egocentric_video" | "third_person_video";
  schemaVersion: string;
  status: "draft" | "awaiting_funding" | "active" | "paused" | "closed";
  budgetUsd: number;
  rewardPerTaskUsd: number;
  deadline: string;
  /** Task counts by lifecycle bucket. */
  taskCounts: {
    total: number;
    available: number;
    inProgress: number;
    inReview: number;
    accepted: number;
    needsRevision: number;
  };
  /** Spend reconciliation, drawn from real settlement records only. */
  spend: {
    reservedUsd: number;
    eligibleUsd: number;
    paidUsd: number;
  };
  quality: {
    /** accepted without correction ÷ reviewed. Null until a sample exists. */
    firstPassAcceptance: number | null;
    /** accepted ÷ completed for the cohort. */
    finalAcceptance: number | null;
    /** Number of reviewed submissions behind the figures above. */
    sampleSize: number;
  };
  exportVersion: string | null;
};

export type ExportPackage = {
  id: string;
  jobId: string;
  version: string;
  format: "jsonl" | "csv";
  records: number;
  schemaVersion: string;
  checksum: string;
  generatedAt: string;
  /** Files contained in the package. */
  files: { name: string; description: string; bytes: number }[];
  /** Signed download links expire; these are the observed expiry times. */
  accessExpiresAt: string;
  state: "generating" | "ready" | "expired" | "failed";
};

export type ProvenanceReceipt = {
  id: string;
  taskId: string;
  annotationHash: string;
  schemaVersion: string;
  policyVersion: string;
  reviewRef: string;
  settlementTxHash?: string;
  network?: string;
  recordedAt: string;
};

export type QualityMetric = {
  key: string;
  label: string;
  /** Null renders as "not enough data yet" rather than a fabricated value. */
  value: number | null;
  unit: "percent" | "count" | "minutes";
  definition: string;
  sampleSize: number;
};

export type AuditEvent = {
  id: string;
  actorLabel: string;
  action: string;
  entityLabel: string;
  at: string;
};
