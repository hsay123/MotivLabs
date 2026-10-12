"use client";

import { useState } from "react";
import type { ReviewDecision, Task } from "@/lib/api/types";
import { media } from "@/lib/media/assets";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import {
  AlertTriangle,
  Check,
  Info,
  Scale,
  ShieldCheck,
} from "@/components/ui/icons";
import { formatTimecode } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const REASON_CODES: Record<ReviewDecision, string[]> = {
  accept: ["meets_rubric", "acceptable_with_notes"],
  request_revision: [
    "timestamp_error",
    "missing_segment",
    "wrong_label",
    "incomplete_record",
  ],
  reject: ["off_policy", "unusable", "duplicate_submission"],
  escalate: ["ambiguous_case", "rubric_conflict", "possible_conflict_of_interest"],
};

const DECISIONS: {
  key: ReviewDecision;
  label: string;
  tone: "primary" | "secondary" | "danger";
}[] = [
  { key: "accept", label: "Accept", tone: "primary" },
  { key: "request_revision", label: "Request correction", tone: "secondary" },
  { key: "reject", label: "Reject", tone: "danger" },
  { key: "escalate", label: "Escalate to adjudicator", tone: "secondary" },
];

const RUBRIC = [
  "Every visible action in the clip is represented by a segment.",
  "Segment boundaries align with the action, not the frame edges.",
  "Action labels match the schema's permitted values.",
  "Failure outcomes carry a plausible failure reason.",
  "No segment extends beyond the assigned clip range.",
];

/**
 * Review console.
 *
 * Source clip beside the submitted segments, validation results, the
 * rubric and a decision panel. The reason code is mandatory for every
 * outcome except acceptance, which mirrors the specification's requirement
 * that decisions be recorded with a reason.
 */
export function ReviewConsole({ task }: { task: Task }) {
  const submission = task.latestSubmission;
  const [decision, setDecision] = useState<ReviewDecision | null>(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [recorded, setRecorded] = useState<ReviewDecision | null>(null);

  const needsReason = decision !== null && decision !== "accept";
  const canRecord =
    decision !== null && (!needsReason || reason.length > 0) && submission !== undefined;

  if (recorded) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success-line bg-success-bg text-success-fg">
            <Check className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-title text-ink">
              Decision staged
            </h2>
            <p className="mt-2 max-w-2xl text-body-sm text-ink-3">
              A <strong className="text-ink">{recorded.replace("_", " ")}</strong>{" "}
              decision for {task.id} was prepared with reason{" "}
              <code className="font-mono text-[12px] text-ink-2">
                {reason || "meets_rubric"}
              </code>
              . Nothing was recorded, because this build has no platform API
              connected — in production the decision is written against the
              submission version, reviewer, rubric version and timestamp.
            </p>
            <div className="mt-5 flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setRecorded(null);
                  setDecision(null);
                  setReason("");
                  setNotes("");
                }}
              >
                Review another decision
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Source */}
      <div className="lg:col-span-7">
        <div className="rounded-xl border border-line bg-surface p-5">
          <h2 className="font-display text-title text-ink">Source clip</h2>
          <p className="mt-1 text-caption text-ink-4">
            {task.clipLabel} · {task.assetId}
          </p>
          <div className="mt-4">
            <MediaPlaceholder
              asset={media.taskClip}
              tone="dark"
              sizes="(min-width: 1024px) 640px, 100vw"
              showAssetPath={false}
            />
          </div>
          <p className="mt-3 flex items-start gap-2 text-caption text-ink-4">
            <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Reviewers see the assigned segment only, never the full dataset.
          </p>
        </div>

        {/* Submitted segments */}
        <div className="mt-6 rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-title text-ink">
              Submitted segments
            </h2>
            <div className="flex items-center gap-2">
              <Badge tone="outline">v{submission?.version ?? 1}</Badge>
              {submission?.validation.passed ? (
                <span className="inline-flex items-center gap-1.5 text-caption font-medium text-success-fg">
                  <Check className="h-3.5 w-3.5" />
                  Validation passed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-caption font-medium text-danger-fg">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Validation errors
                </span>
              )}
            </div>
          </div>

          <ul className="mt-4 border-t border-line">
            {submission?.segments.map((segment, index) => (
              <li
                key={index}
                className="grid grid-cols-12 gap-2 border-b border-line py-3 text-body-sm"
              >
                <span className="col-span-3 font-mono text-[12px] text-ink-3 tnum">
                  {formatTimecode(segment.startMs)}–{formatTimecode(segment.endMs)}
                </span>
                <span className="col-span-3 capitalize text-ink">
                  {segment.actionLabel}
                </span>
                <span className="col-span-3">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-caption",
                      segment.outcome === "failure"
                        ? "border-danger-line bg-danger-bg text-danger-fg"
                        : "border-line-strong text-ink-3",
                    )}
                  >
                    {segment.outcome}
                  </span>
                </span>
                <span className="col-span-3 text-right text-ink-3">
                  {segment.object ?? "—"}
                  {segment.failureReason ? ` · ${segment.failureReason}` : ""}
                </span>
              </li>
            ))}
          </ul>

          {submission && !submission.validation.passed ? (
            <ul className="mt-4 space-y-2 rounded-lg border border-danger-line bg-danger-bg p-3.5">
              {submission.validation.issues.map((issue) => (
                <li key={issue.path} className="flex items-start gap-2">
                  <AlertTriangle
                    aria-hidden
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-fg"
                  />
                  <span className="text-caption text-danger-fg">
                    <code className="font-mono text-[11px]">{issue.path}</code> —{" "}
                    {issue.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {/* Decision */}
      <aside className="lg:col-span-5">
        <div className="sticky top-32 space-y-5">
          {/* Rubric */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 font-display text-title text-ink">
              <ShieldCheck className="h-4 w-4 text-accent-600" />
              Rubric
            </h2>
            <ul className="mt-3 space-y-2.5">
              {RUBRIC.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    aria-hidden
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                  />
                  <span className="text-body-sm text-ink-3">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-line pt-3 text-caption text-ink-4">
              Rubric version: {submission?.schemaVersion ?? "action-segments-v1"} ·{" "}
              published reason codes only
            </p>
          </div>

          {/* Decision panel */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-display text-title text-ink">Decision</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {DECISIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={decision === item.key}
                  onClick={() => {
                    setDecision(item.key);
                    setReason("");
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-body-sm font-medium transition-colors",
                    decision === item.key
                      ? item.tone === "danger"
                        ? "border-danger-fg bg-danger-fg text-white"
                        : "border-accent-500 bg-accent-600 text-white"
                      : "border-line-strong text-ink-2 hover:border-ink-4",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {decision ? (
              <div className="mt-4 space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-body-sm font-medium text-ink">
                    Reason code
                    {needsReason ? (
                      <span className="ml-1 text-ink-4">*</span>
                    ) : (
                      <span className="ml-1.5 text-caption font-normal text-ink-4">
                        optional
                      </span>
                    )}
                  </span>
                  <select
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    className="h-10 rounded-md border border-line-strong bg-surface px-3 font-mono text-[13px] text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                  >
                    <option value="">Select a reason code…</option>
                    {REASON_CODES[decision].map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>

                <TextAreaField
                  id="notes"
                  label="Notes for the contributor"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  hint="Actionable feedback is required for corrections and rejections."
                />

                <div className="flex items-center gap-3">
                  <Button
                    disabled={!canRecord}
                    onClick={() => setRecorded(decision)}
                  >
                    Record decision
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setDecision(null);
                      setReason("");
                    }}
                    className="text-caption text-ink-4 hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-caption text-ink-4">
                Choose a decision to see its permitted reason codes.
              </p>
            )}
          </div>

          <div className="flex items-start gap-2.5 rounded-lg border border-line bg-surface p-4">
            <Scale aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
            <p className="text-caption text-ink-3">
              You cannot review or approve your own submissions. Conflicts are
              escalated to an independent adjudicator.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
