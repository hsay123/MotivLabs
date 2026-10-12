/**
 * Sample fixtures for interface preview.
 * -------------------------------------------------------------------
 * These records exist **only** so the product screens can be designed and
 * reviewed before a platform API is connected. They are never presented
 * as real activity: every screen that renders them shows the "Sample
 * data" indicator, and `getDataSource()` reports `"preview"`.
 *
 * When `NEXT_PUBLIC_API_BASE_URL` is configured, screens read from the
 * API instead and this module is not used.
 *
 * Nothing here represents a real buyer, contributor, payment or
 * settlement. There are no invented customer names, no on-chain
 * transactions and no claimed certifications.
 */

import type {
  AnnotationSegment,
  AuditEvent,
  ExportPackage,
  Job,
  ProvenanceReceipt,
  QualityMetric,
  Task,
} from "./types";

const day = (n: number) =>
  new Date(Date.UTC(2026, 9, 12 + n, 9, 0, 0)).toISOString();

const seg = (
  startMs: number,
  endMs: number,
  actionLabel: AnnotationSegment["actionLabel"],
  outcome: AnnotationSegment["outcome"],
  confidence: AnnotationSegment["confidence"],
  object?: string,
  failureReason?: AnnotationSegment["failureReason"],
): AnnotationSegment => ({
  startMs,
  endMs,
  actionLabel,
  outcome,
  confidence,
  ...(object ? { object } : {}),
  ...(failureReason ? { failureReason } : {}),
});

/* ---- Jobs ---------------------------------------------------------- */

export const sampleJobs: Job[] = [
  {
    id: "ML-1041",
    projectId: "PRJ-ASSEMBLY-A",
    title: "Pick-and-place failure events",
    modality: "egocentric_video",
    schemaVersion: "action-segments-v1",
    status: "active",
    budgetUsd: 4800,
    rewardPerTaskUsd: 12,
    deadline: day(11),
    taskCounts: {
      total: 320,
      available: 96,
      inProgress: 24,
      inReview: 38,
      accepted: 158,
      needsRevision: 4,
    },
    spend: {
      // Committed to in-flight work (in progress + in review).
      reservedUsd: 744,
      // Accepted but not yet settled.
      eligibleUsd: 240,
      // Settled against reconciled payment records.
      paidUsd: 1656,
    },
    quality: {
      firstPassAcceptance: 0.86,
      finalAcceptance: 0.94,
      sampleSize: 196,
    },
    exportVersion: null,
  },
  {
    id: "ML-1039",
    projectId: "PRJ-WAREHOUSE-B",
    title: "Warehouse handoff sequences",
    modality: "third_person_video",
    schemaVersion: "action-segments-v1",
    status: "active",
    budgetUsd: 3600,
    rewardPerTaskUsd: 9,
    deadline: day(6),
    taskCounts: {
      total: 400,
      available: 210,
      inProgress: 40,
      inReview: 22,
      accepted: 124,
      needsRevision: 4,
    },
    spend: {
      reservedUsd: 558,
      eligibleUsd: 108,
      paidUsd: 1116,
    },
    quality: {
      firstPassAcceptance: 0.79,
      finalAcceptance: 0.91,
      sampleSize: 140,
    },
    exportVersion: null,
  },
  {
    id: "ML-1036",
    projectId: "PRJ-MOBILE-NAV-C",
    title: "Mobile robot navigation events",
    modality: "egocentric_video",
    schemaVersion: "action-segments-v1",
    status: "closed",
    budgetUsd: 1800,
    rewardPerTaskUsd: 9,
    deadline: day(-14),
    taskCounts: {
      total: 200,
      available: 0,
      inProgress: 0,
      inReview: 0,
      accepted: 196,
      needsRevision: 4,
    },
    spend: {
      reservedUsd: 0,
      eligibleUsd: 0,
      paidUsd: 1764,
    },
    quality: {
      firstPassAcceptance: 0.83,
      finalAcceptance: 0.98,
      sampleSize: 200,
    },
    exportVersion: "v3",
  },
];

/* ---- Contributor task queue ---------------------------------------- */

export const sampleContributorTasks: Task[] = [
  {
    id: "TSK-8814",
    jobId: "ML-1041",
    assetId: "asset_private_042",
    clipLabel: "Clip 042 · 00:12–00:31",
    startMs: 12000,
    endMs: 31000,
    status: "available",
    rewardUsd: 12,
    estimatedMinutes: 6,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(4),
    payout: "not_eligible",
  },
  {
    id: "TSK-8815",
    jobId: "ML-1041",
    assetId: "asset_private_043",
    clipLabel: "Clip 043 · 00:00–00:18",
    startMs: 0,
    endMs: 18000,
    status: "available",
    rewardUsd: 12,
    estimatedMinutes: 5,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(4),
    payout: "not_eligible",
  },
  {
    id: "TSK-8817",
    jobId: "ML-1041",
    assetId: "asset_private_051",
    clipLabel: "Clip 051 · 01:04–01:22",
    startMs: 64000,
    endMs: 82000,
    status: "available",
    rewardUsd: 18,
    estimatedMinutes: 11,
    schemaVersion: "action-segments-v1",
    difficulty: "advanced",
    deadline: day(4),
    payout: "not_eligible",
  },
  {
    id: "TSK-8821",
    jobId: "ML-1039",
    assetId: "asset_private_118",
    clipLabel: "Clip 118 · 00:22–00:40",
    startMs: 22000,
    endMs: 40000,
    status: "available",
    rewardUsd: 9,
    estimatedMinutes: 4,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(3),
    payout: "not_eligible",
  },
  {
    id: "TSK-8822",
    jobId: "ML-1039",
    assetId: "asset_private_121",
    clipLabel: "Clip 121 · 02:10–02:29",
    startMs: 130000,
    endMs: 149000,
    status: "available",
    rewardUsd: 9,
    estimatedMinutes: 4,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(3),
    payout: "not_eligible",
  },
  {
    id: "TSK-8809",
    jobId: "ML-1041",
    assetId: "asset_private_037",
    clipLabel: "Clip 037 · 00:41–00:59",
    startMs: 41000,
    endMs: 59000,
    status: "accepted",
    rewardUsd: 12,
    estimatedMinutes: 5,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(-1),
    payout: "pending",
  },
  {
    id: "TSK-8802",
    jobId: "ML-1041",
    assetId: "asset_private_019",
    clipLabel: "Clip 019 · 00:06–00:24",
    startMs: 6000,
    endMs: 24000,
    status: "revision_requested",
    rewardUsd: 12,
    estimatedMinutes: 5,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(1),
    payout: "not_eligible",
  },
  {
    id: "TSK-8798",
    jobId: "ML-1039",
    assetId: "asset_private_101",
    clipLabel: "Clip 101 · 00:33–00:52",
    startMs: 33000,
    endMs: 52000,
    status: "paid",
    rewardUsd: 9,
    estimatedMinutes: 4,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(-6),
    payout: "confirmed",
  },
];

/* ---- The task opened in the annotation workspace -------------------- */

export const sampleActiveTask: Task = {
  id: "TSK-8814",
  jobId: "ML-1041",
  assetId: "asset_private_042",
  clipLabel: "Clip 042 · 00:12–00:31",
  startMs: 12000,
  endMs: 31000,
  status: "draft",
  rewardUsd: 12,
  estimatedMinutes: 6,
  schemaVersion: "action-segments-v1",
  difficulty: "standard",
  deadline: day(4),
  leaseExpiresAt: day(1),
  payout: "not_eligible",
};

export const sampleDraftSegments: AnnotationSegment[] = [
  seg(1240, 2380, "reach", "success", 4, "red_block"),
  seg(2380, 3510, "grasp", "failure", 3, "red_block", "slip"),
  seg(3510, 4620, "recover", "success", 4),
];

/* ---- Review queue --------------------------------------------------- */

export const sampleReviewQueue: Task[] = [
  {
    id: "TSK-8810",
    jobId: "ML-1041",
    assetId: "asset_private_044",
    clipLabel: "Clip 044 · 00:00–00:19",
    startMs: 0,
    endMs: 19000,
    status: "in_review",
    rewardUsd: 12,
    estimatedMinutes: 5,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(3),
    payout: "not_eligible",
    latestSubmission: {
      id: "SUB-22418",
      taskId: "TSK-8810",
      version: 1,
      submittedAt: day(-1),
      schemaVersion: "action-segments-v1",
      segments: [
        seg(980, 2140, "reach", "success", 5, "blue_cube"),
        seg(2140, 3320, "grasp", "success", 4, "blue_cube"),
        seg(3320, 4180, "lift", "partial", 3, "blue_cube"),
      ],
      validation: { passed: true, issues: [], checkedAt: day(-1) },
      reviewStatus: "in_review",
    },
  },
  {
    id: "TSK-8811",
    jobId: "ML-1041",
    assetId: "asset_private_047",
    clipLabel: "Clip 047 · 00:52–01:11",
    startMs: 52000,
    endMs: 71000,
    status: "in_review",
    rewardUsd: 12,
    estimatedMinutes: 5,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(3),
    payout: "not_eligible",
    latestSubmission: {
      id: "SUB-22419",
      taskId: "TSK-8811",
      version: 2,
      submittedAt: day(-1),
      schemaVersion: "action-segments-v1",
      segments: [
        seg(1120, 2200, "reach", "success", 4, "tray"),
        seg(2200, 3300, "grasp", "failure", 2, "tray", "wrong_target"),
        seg(3300, 3950, "recover", "success", 5),
      ],
      validation: {
        passed: false,
        checkedAt: day(-1),
        issues: [
          {
            path: "segments[2].end_ms",
            message:
              "Segment ends after the clip boundary and cannot be guaranteed inside the assigned range.",
            severity: "error",
          },
        ],
      },
      reviewStatus: "in_review",
    },
  },
  {
    id: "TSK-8813",
    jobId: "ML-1039",
    assetId: "asset_private_109",
    clipLabel: "Clip 109 · 01:20–01:38",
    startMs: 80000,
    endMs: 98000,
    status: "in_review",
    rewardUsd: 9,
    estimatedMinutes: 4,
    schemaVersion: "action-segments-v1",
    difficulty: "standard",
    deadline: day(2),
    payout: "not_eligible",
    latestSubmission: {
      id: "SUB-22421",
      taskId: "TSK-8813",
      version: 1,
      submittedAt: day(-2),
      schemaVersion: "action-segments-v1",
      segments: [
        seg(640, 1720, "reach", "success", 4, "pallet"),
        seg(1720, 2860, "place", "success", 4, "pallet"),
      ],
      validation: { passed: true, issues: [], checkedAt: day(-2) },
      reviewStatus: "in_review",
    },
  },
];

/* ---- Exports -------------------------------------------------------- */

export const sampleExports: ExportPackage[] = [
  {
    id: "EXP-0091",
    jobId: "ML-1036",
    version: "v3",
    format: "jsonl",
    records: 196,
    schemaVersion: "action-segments-v1",
    checksum: "sha256:4f1c…a9e2",
    generatedAt: day(-12),
    accessExpiresAt: day(2),
    state: "ready",
    files: [
      { name: "annotations.jsonl", description: "Accepted records, one per line.", bytes: 921_600 },
      { name: "annotations.csv", description: "Flattened interval rows.", bytes: 641_000 },
      { name: "schema.json", description: "Schema definition for this export.", bytes: 4_120 },
      { name: "quality_report.json", description: "Acceptance and correction counts.", bytes: 2_048 },
      { name: "manifest.json", description: "Versions, source references and checksum.", bytes: 3_310 },
    ],
  },
  {
    id: "EXP-0088",
    jobId: "ML-1036",
    version: "v2",
    format: "csv",
    records: 140,
    schemaVersion: "action-segments-v1",
    checksum: "sha256:9b73…10cd",
    generatedAt: day(-21),
    accessExpiresAt: day(-7),
    state: "expired",
    files: [
      { name: "annotations.csv", description: "Flattened interval rows.", bytes: 458_000 },
      { name: "manifest.json", description: "Versions, source references and checksum.", bytes: 3_180 },
    ],
  },
];

/* ---- Quality metrics ------------------------------------------------ */

export const sampleQualityMetrics: QualityMetric[] = [
  {
    key: "first_pass_acceptance",
    label: "First-pass acceptance",
    value: 86,
    unit: "percent",
    definition:
      "Submissions accepted without a correction request ÷ submissions reviewed, for the stated window.",
    sampleSize: 196,
  },
  {
    key: "final_acceptance",
    label: "Final acceptance",
    value: 94,
    unit: "percent",
    definition: "Submissions accepted ÷ completed submissions for this cohort.",
    sampleSize: 210,
  },
  {
    key: "correction_rate",
    label: "Correction rate",
    value: 12,
    unit: "percent",
    definition:
      "Submissions returned for correction ÷ submissions reviewed, grouped by rubric version.",
    sampleSize: 196,
  },
  {
    key: "schema_defects",
    label: "Schema validation defects",
    value: 3,
    unit: "count",
    definition:
      "Submissions blocked by the server-side schema validator before reaching human review.",
    sampleSize: 320,
  },
  {
    key: "submit_to_decision",
    label: "Median submit-to-decision",
    value: 41,
    unit: "minutes",
    definition:
      "Median time from submission to a recorded review decision, business hours only.",
    sampleSize: 196,
  },
  {
    key: "audit_defect_rate",
    label: "Random-audit defect rate",
    value: null,
    unit: "percent",
    definition:
      "Defects found when re-reviewing a random sample of accepted work. Not enough audits recorded yet.",
    sampleSize: 0,
  },
];

/* ---- Provenance receipts -------------------------------------------- */

export const sampleReceipts: ProvenanceReceipt[] = [
  {
    id: "RCP-77120",
    taskId: "TSK-8798",
    annotationHash: "keccak256:0x7c1a…4d02",
    schemaVersion: "action-segments-v1",
    policyVersion: "policy-2026-09-30",
    reviewRef: "REV-44120",
    recordedAt: day(-6),
  },
  {
    id: "RCP-77118",
    taskId: "TSK-8790",
    annotationHash: "keccak256:0x08be…91fa",
    schemaVersion: "action-segments-v1",
    policyVersion: "policy-2026-09-30",
    reviewRef: "REV-44112",
    recordedAt: day(-6),
  },
  {
    id: "RCP-77102",
    taskId: "TSK-8771",
    annotationHash: "keccak256:0x51d9…e7b3",
    schemaVersion: "action-segments-v1",
    policyVersion: "policy-2026-09-30",
    reviewRef: "REV-44098",
    recordedAt: day(-7),
  },
];

/* ---- Audit trail ----------------------------------------------------- */

export const sampleAuditEvents: AuditEvent[] = [
  {
    id: "EVT-55120",
    actorLabel: "Reviewer · R-118",
    action: "Review decision recorded",
    entityLabel: "SUB-22413 · accepted",
    at: day(-1),
  },
  {
    id: "EVT-55119",
    actorLabel: "Contributor · C-204",
    action: "Submission created",
    entityLabel: "TSK-8810 · version 1",
    at: day(-1),
  },
  {
    id: "EVT-55118",
    actorLabel: "Validator",
    action: "Schema validation failed",
    entityLabel: "SUB-22419 · 1 error",
    at: day(-1),
  },
  {
    id: "EVT-55117",
    actorLabel: "Buyer · B-014",
    action: "Job funded",
    entityLabel: "ML-1041 · $4,800",
    at: day(-9),
  },
  {
    id: "EVT-55116",
    actorLabel: "Buyer · B-014",
    action: "Job published",
    entityLabel: "ML-1041 · action-segments-v1",
    at: day(-9),
  },
];
