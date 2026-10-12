"use client";

import { useMemo, useState } from "react";
import type {
  ActionLabel,
  AnnotationSegment,
  FailureReason,
  Outcome,
  Task,
} from "@/lib/api/types";
import { media } from "@/lib/media/assets";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { AlertTriangle, Check, Info, Play } from "@/components/ui/icons";
import { formatTimecode, formatUsd } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const ACTIONS: ActionLabel[] = ["reach", "grasp", "lift", "place", "inspect", "recover", "other"];
const OUTCOMES: Outcome[] = ["success", "partial", "failure", "unknown"];
const FAILURES: FailureReason[] = [
  "slip",
  "collision",
  "occlusion",
  "wrong_target",
  "dropped_object",
  "other",
];
const CONFIDENCE = [1, 2, 3, 4, 5] as const;

type Draft = AnnotationSegment & { id: string };

const withIds = (segments: AnnotationSegment[]): Draft[] =>
  segments.map((segment, index) => ({ ...segment, id: `seg-${index}` }));

/**
 * Annotation workspace.
 *
 * The core product surface. Layout puts the clip and timeline first, the
 * schema-driven segment fields second, and instructions alongside. A
 * local validator mirrors the server rules so feedback is immediate —
 * but it is explicitly labelled as a preview check, because the server
 * validator is authoritative.
 */
export function AnnotationWorkspace({
  task,
  initialSegments,
}: {
  task: Task;
  initialSegments: AnnotationSegment[];
}) {
  const durationMs = task.endMs - task.startMs;
  const [segments, setSegments] = useState<Draft[]>(withIds(initialSegments));
  const [dirty, setDirty] = useState(false);
  const [outcome, setOutcome] = useState<"idle" | "saved" | "submitted">("idle");

  const update = (id: string, patch: Partial<Draft>) => {
    setSegments((prev) =>
      prev.map((segment) => (segment.id === id ? { ...segment, ...patch } : segment)),
    );
    setDirty(true);
    setOutcome("idle");
  };

  const addSegment = () => {
    const last = segments[segments.length - 1];
    const start = last ? last.endMs : 0;
    setSegments((prev) => [
      ...prev,
      {
        id: `seg-${Date.now()}`,
        startMs: start,
        endMs: Math.min(start + 1000, durationMs),
        actionLabel: "reach",
        outcome: "success",
        confidence: 3,
      },
    ]);
    setDirty(true);
  };

  const removeSegment = (id: string) => {
    setSegments((prev) => prev.filter((segment) => segment.id !== id));
    setDirty(true);
  };

  const issues = useMemo(() => {
    const list: { path: string; message: string; severity: "error" | "warning" }[] = [];
    segments.forEach((segment, index) => {
      if (segment.endMs <= segment.startMs) {
        list.push({
          path: `segments[${index}].end_ms`,
          message: "End time must be after the start time.",
          severity: "error",
        });
      }
      if (segment.startMs < 0 || segment.endMs > durationMs) {
        list.push({
          path: `segments[${index}].end_ms`,
          message: "Segment exceeds the clip boundary and cannot be guaranteed inside the assigned range.",
          severity: "error",
        });
      }
      if (segment.outcome === "failure" && !segment.failureReason) {
        list.push({
          path: `segments[${index}].failure_reason`,
          message: "A failure outcome requires a failure reason.",
          severity: "error",
        });
      }
      if (!segment.object) {
        list.push({
          path: `segments[${index}].object`,
          message: "No object recorded; free-form but recommended.",
          severity: "warning",
        });
      }
    });
    for (let i = 1; i < segments.length; i += 1) {
      if (segments[i].startMs < segments[i - 1].endMs) {
        list.push({
          path: `segments[${i}].start_ms`,
          message: "Segment overlaps the previous one.",
          severity: "warning",
        });
      }
    }
    return list;
  }, [segments, durationMs]);

  const errors = issues.filter((issue) => issue.severity === "error");
  const canSubmit = errors.length === 0 && segments.length > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Left: clip, timeline, segments */}
      <div className="lg:col-span-8">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[12px] text-ink-4">
                {task.id} · {task.assetId}
              </p>
              <h2 className="mt-1 font-display text-title text-ink">
                {task.clipLabel}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusChip status={task.status} />
              <Badge tone="outline" className="font-mono">
                {task.schemaVersion}
              </Badge>
            </div>
          </div>

          <div className="mt-4">
            <MediaPlaceholder
              asset={media.taskClip}
              tone="dark"
              sizes="(min-width: 1024px) 720px, 100vw"
              showAssetPath={false}
            >
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-3 p-3">
                <button
                  type="button"
                  disabled
                  aria-label="Play (requires connected media)"
                  className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink"
                >
                  <Play className="h-4 w-4" />
                </button>
                <div className="pointer-events-auto flex-1 rounded-md border border-line-inverse bg-night/60 px-3 py-1.5 backdrop-blur-sm">
                  <div className="flex justify-between font-mono text-[11px] text-night-ink-3">
                    <span>{formatTimecode(0)}</span>
                    <span>{formatTimecode(durationMs)}</span>
                  </div>
                </div>
              </div>
            </MediaPlaceholder>
          </div>

          {/* Timeline rail */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-caption text-ink-4">
              <span>
                Timeline · clip length {Math.round(durationMs / 1000)}s
              </span>
              <span>{segments.length} segments</span>
            </div>
            <div className="relative mt-2 h-9 overflow-hidden rounded-md border border-line bg-surface-sunken">
              {segments.map((segment) => {
                const left = durationMs > 0 ? (segment.startMs / durationMs) * 100 : 0;
                const width =
                  durationMs > 0
                    ? Math.max(1, ((segment.endMs - segment.startMs) / durationMs) * 100)
                    : 0;
                return (
                  <div
                    key={segment.id}
                    title={`${segment.actionLabel} · ${formatTimecode(segment.startMs)}–${formatTimecode(segment.endMs)}`}
                    className={cn(
                      "absolute top-1 bottom-1 rounded-sm border",
                      segment.outcome === "failure"
                        ? "border-danger-line bg-danger-bg"
                        : "border-accent-200 bg-accent-100",
                    )}
                    style={{ left: `${left}%`, width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Segments */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-title text-ink">Segments</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addSegment}>
              Add segment
            </Button>
          </div>

          <ul className="mt-4 space-y-3">
            {segments.map((segment, index) => (
              <li
                key={segment.id}
                className="rounded-xl border border-line bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[12px] text-ink-4">
                    segments[{index}]
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSegment(segment.id)}
                    className="text-caption text-ink-4 hover:text-danger-fg"
                  >
                    Remove
                  </button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-caption text-ink-3">Start (ms)</span>
                    <input
                      type="number"
                      value={segment.startMs}
                      onChange={(event) =>
                        update(segment.id, { startMs: Number(event.target.value) })
                      }
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 font-mono text-[13px] text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-caption text-ink-3">End (ms)</span>
                    <input
                      type="number"
                      value={segment.endMs}
                      onChange={(event) =>
                        update(segment.id, { endMs: Number(event.target.value) })
                      }
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 font-mono text-[13px] text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-caption text-ink-3">Action</span>
                    <select
                      value={segment.actionLabel}
                      onChange={(event) =>
                        update(segment.id, {
                          actionLabel: event.target.value as ActionLabel,
                        })
                      }
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] capitalize text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                    >
                      {ACTIONS.map((action) => (
                        <option key={action} value={action}>
                          {action}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-caption text-ink-3">Outcome</span>
                    <select
                      value={segment.outcome}
                      onChange={(event) =>
                        update(segment.id, { outcome: event.target.value as Outcome })
                      }
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] capitalize text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                    >
                      {OUTCOMES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-caption text-ink-3">Failure reason</span>
                    <select
                      value={segment.failureReason ?? ""}
                      disabled={segment.outcome !== "failure"}
                      onChange={(event) =>
                        update(segment.id, {
                          failureReason: (event.target.value || undefined) as
                            | FailureReason
                            | undefined,
                        })
                      }
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink disabled:bg-surface-muted disabled:text-ink-4 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                    >
                      <option value="">—</option>
                      {FAILURES.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-caption text-ink-3">Object</span>
                    <input
                      type="text"
                      value={segment.object ?? ""}
                      onChange={(event) =>
                        update(segment.id, { object: event.target.value })
                      }
                      placeholder="e.g. red_block"
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 text-[13px] text-ink placeholder:text-ink-4 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-caption text-ink-3">Confidence</span>
                    <select
                      value={segment.confidence}
                      onChange={(event) =>
                        update(segment.id, {
                          confidence: Number(event.target.value) as 1 | 2 | 3 | 4 | 5,
                        })
                      }
                      className="h-9 rounded-md border border-line-strong bg-surface px-2.5 font-mono text-[13px] text-ink focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/25"
                    >
                      {CONFIDENCE.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-col justify-end">
                    <span className="text-caption text-ink-4">
                      {formatTimecode(segment.startMs)} → {formatTimecode(segment.endMs)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {segments.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center">
              <p className="text-title text-ink">No segments yet</p>
              <p className="mx-auto mt-1.5 max-w-md text-body-sm text-ink-3">
                Add the first action segment and place its boundaries against the
                timecode.
              </p>
              <Button className="mt-4" type="button" variant="secondary" onClick={addSegment}>
                Add segment
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Right: instructions, validation, submit */}
      <aside className="lg:col-span-4">
        <div className="sticky top-32 space-y-5">
          {/* Validation */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-title text-ink">Validation</h2>
              {errors.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 text-caption font-medium text-success-fg">
                  <Check className="h-3.5 w-3.5" />
                  Passes preview checks
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-caption font-medium text-danger-fg">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {errors.length} error{errors.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {issues.length === 0 ? (
              <p className="mt-3 text-body-sm text-ink-3">
                No issues found by the local check.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {issues.map((issue, index) => (
                  <li key={`${issue.path}-${index}`} className="flex gap-2.5">
                    {issue.severity === "error" ? (
                      <AlertTriangle
                        aria-hidden
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-fg"
                      />
                    ) : (
                      <Info
                        aria-hidden
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pending-fg"
                      />
                    )}
                    <span>
                      <code className="font-mono text-[11px] text-ink-4">
                        {issue.path}
                      </code>
                      <span className="mt-0.5 block text-caption text-ink-3">
                        {issue.message}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 flex items-start gap-2 border-t border-line pt-3 text-caption text-ink-4">
              <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Preview checks only. The server-side validator is authoritative and
              versioned against the schema.
            </p>
          </div>

          {/* Instructions */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <h2 className="font-display text-title text-ink">Instructions</h2>
            <ul className="mt-3 space-y-2.5 text-body-sm text-ink-3">
              <li>Label only actions visible in the assigned clip.</li>
              <li>Each segment needs a start, an end and an action label.</li>
              <li>A failure outcome must carry a failure reason.</li>
              <li>Boundaries must stay inside the clip range.</li>
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <p className="text-caption uppercase tracking-[0.06em] text-ink-4">
                Worked example
              </p>
              <p className="mt-1.5 font-mono text-[11px] text-ink-3">
                reach → grasp(slip) → recover
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-ink-3">Reward on acceptance</span>
              <span className="font-display text-title text-ink tnum">
                {formatUsd(task.rewardUsd)}
              </span>
            </div>
            <p className="mt-2 text-caption text-ink-4">
              Only accepted work becomes eligible for payment.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDirty(false);
                  setOutcome("saved");
                }}
              >
                Save draft
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => setOutcome("submitted")}
              >
                Submit for review
              </Button>
            </div>

            {dirty ? (
              <p className="mt-3 text-caption text-pending-fg">
                Unsaved changes. Drafts autosave where the API is connected.
              </p>
            ) : null}

            {outcome !== "idle" ? (
              <div
                role="status"
                className="mt-3 flex items-start gap-2 rounded-md border border-info-line bg-info-bg p-3"
              >
                <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info-fg" />
                <p className="text-caption text-info-fg">
                  {outcome === "saved"
                    ? "Draft held locally — no platform API is connected, so nothing was persisted."
                    : "Submission not created — this build has no platform API. In production a submission creates an immutable version and enters validation."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
