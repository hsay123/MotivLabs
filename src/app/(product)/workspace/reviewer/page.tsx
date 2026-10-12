import type { Metadata } from "next";
import Link from "next/link";
import { readReviewQueue } from "@/lib/api/read";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertTriangle, ArrowRight, Check, Clock, Scale } from "@/components/ui/icons";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Review queue" };

export default async function ReviewerQueuePage() {
  const { data: queue } = await readReviewQueue();

  const blocked = queue.filter((task) => task.latestSubmission?.validation.passed === false);
  const clean = queue.filter((task) => task.latestSubmission?.validation.passed !== false);

  return (
    <>
      <WorkspaceHeader
        eyebrow="Reviewer"
        title="Review queue"
        description="Submissions awaiting a decision. You cannot review your own work, and validation results are surfaced before you start."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Awaiting decision" value={String(queue.length)} hint="Across all active jobs" />
        <Stat
          label="Validation errors"
          value={String(blocked.length)}
          hint="Flagged before human review"
          tone="muted"
        />
        <Stat label="Ready to review" value={String(clean.length)} hint="Passed schema checks" tone="muted" />
      </div>

      <section className="mt-8">
        {queue.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="The queue is clear"
            description="New submissions appear here as contributors submit them. This empty state is real, not a placeholder."
          />
        ) : (
          <ul className="space-y-4">
            {queue.map((task) => {
              const submission = task.latestSubmission;
              const passed = submission?.validation.passed ?? true;
              const version = submission?.version ?? 1;
              const segments = submission?.segments.length ?? 0;

              return (
                <li key={task.id}>
                  <article className="rounded-xl border border-line bg-surface">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[12px] text-ink-4">
                          {task.id}
                        </span>
                        {passed ? (
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
                      <div className="flex items-center gap-3 text-caption text-ink-4">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Due {formatDate(task.deadline)}
                        </span>
                        <Badge tone="neutral">v{version}</Badge>
                      </div>
                    </div>

                    <div className="grid gap-4 px-5 py-4 lg:grid-cols-12 lg:items-center">
                      <div className="lg:col-span-5">
                        <p className="font-medium text-ink">{task.clipLabel}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-ink-4">
                          {task.jobId} · {task.assetId} · {task.schemaVersion}
                        </p>
                      </div>
                      <div className="lg:col-span-4">
                        <p className="text-caption text-ink-4">
                          {segments} segments · {task.estimatedMinutes} min estimate
                        </p>
                        {!passed && submission ? (
                          <p className="mt-1 text-caption text-danger-fg">
                            {submission.validation.issues[0]?.message}
                          </p>
                        ) : null}
                      </div>
                      <div className="lg:col-span-3 lg:text-right">
                        <Link
                          href={`/workspace/reviewer/review/${task.id}`}
                          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-accent-700 hover:underline"
                        >
                          Open review
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
