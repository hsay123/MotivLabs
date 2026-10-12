import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readJob, readQualityMetrics } from "@/lib/api/read";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Progress } from "@/components/product/Progress";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { ArrowRight, Download, FileText, Info } from "@/components/ui/icons";
import { formatCount, formatDate, formatUsd } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Job detail" };

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const { data: job } = await readJob(jobId);
  if (!job) notFound();

  const { data: metrics } = await readQualityMetrics(job.id);

  const remaining =
    job.budgetUsd - job.spend.reservedUsd - job.spend.eligibleUsd - job.spend.paidUsd;

  const buckets = [
    { label: "Available", value: job.taskCounts.available },
    { label: "In progress", value: job.taskCounts.inProgress },
    { label: "In review", value: job.taskCounts.inReview },
    { label: "Needs revision", value: job.taskCounts.needsRevision },
    { label: "Accepted", value: job.taskCounts.accepted },
  ];

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-caption text-ink-4">
        <Link href="/workspace/buyer" className="hover:text-ink">
          Dashboard
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="font-mono">{job.id}</span>
      </nav>

      <WorkspaceHeader
        eyebrow={job.id}
        title={job.title}
        description={
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <StatusChip status={job.status} />
            <span className="font-mono text-[12px] text-ink-4">
              {job.schemaVersion}
            </span>
            <span className="text-ink-3">
              {job.modality === "egocentric_video"
                ? "Egocentric video"
                : "Third-person video"}
            </span>
            <span className="text-ink-3">Deadline {formatDate(job.deadline)}</span>
          </span>
        }
        actions={
          <>
            <ButtonLink href={`/workspace/buyer/jobs/${job.id}/export`} variant="secondary">
              <FileText className="h-4 w-4" />
              Export
            </ButtonLink>
          </>
        }
      />

      {/* Spend reconciliation */}
      <section className="rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-title text-ink">
            Budget reconciliation
          </h2>
          <Badge tone="neutral">Funded: {formatUsd(job.budgetUsd)}</Badge>
        </div>
        <p className="mt-2 flex items-start gap-2 text-caption text-ink-3">
          <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Each figure is drawn from real ledger states. Reserved is committed to
          in-flight work; eligible is accepted but unsettled; settled is
          reconciled to payment records.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Reserved"
            value={formatUsd(job.spend.reservedUsd)}
            hint="In progress + in review"
            tone="muted"
          />
          <Stat
            label="Eligible"
            value={formatUsd(job.spend.eligibleUsd)}
            hint="Accepted, not yet settled"
            tone="muted"
          />
          <Stat
            label="Settled"
            value={formatUsd(job.spend.paidUsd)}
            hint="Reconciled to settlement records"
            tone="muted"
          />
          <Stat
            label="Remaining"
            value={formatUsd(remaining)}
            hint="Budget less the above"
            tone="muted"
          />
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-caption text-ink-4">
            <span>Allocated</span>
            <span className="tnum">
              {formatUsd(job.budgetUsd - remaining)} / {formatUsd(job.budgetUsd)}
            </span>
          </div>
          <Progress
            className="mt-1.5"
            value={job.budgetUsd - remaining}
            max={job.budgetUsd}
            tone="accent"
            label="Allocated share of budget"
          />
        </div>
      </section>

      {/* Task states + quality */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-6">
          <h2 className="font-display text-title text-ink">Task states</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {buckets.map((bucket) => (
              <div
                key={bucket.label}
                className="rounded-lg border border-line bg-surface p-3.5"
              >
                <p className="text-caption text-ink-4">{bucket.label}</p>
                <p className="mt-1 font-display text-[1.375rem] font-medium text-ink tnum">
                  {formatCount(bucket.value)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-caption text-ink-4">
            {formatCount(job.taskCounts.total)} tasks total ·{" "}
            {job.taskCounts.accepted} accepted
          </p>
        </section>

        <section className="lg:col-span-6">
          <h2 className="font-display text-title text-ink">Quality</h2>
          <ul className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
            {metrics.map((metric, index) => (
              <li
                key={metric.key}
                className={
                  index === 0
                    ? "px-5 py-3.5"
                    : "border-t border-line px-5 py-3.5"
                }
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-body-sm font-medium text-ink">
                    {metric.label}
                  </span>
                  <span className="font-display text-title text-ink tnum">
                    {metric.value === null ? (
                      <span className="text-body-sm font-normal text-ink-4">
                        Not enough data
                      </span>
                    ) : metric.unit === "percent" ? (
                      `${metric.value}%`
                    ) : metric.unit === "minutes" ? (
                      `${metric.value} min`
                    ) : (
                      formatCount(metric.value)
                    )}
                  </span>
                </div>
                <p className="mt-1 text-caption text-ink-3">{metric.definition}</p>
                <p className="mt-1 text-caption text-ink-4">
                  Sample: {metric.sampleSize}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Export */}
      <section className="mt-6">
        <h2 className="font-display text-title text-ink">Delivery</h2>
        {job.exportVersion ? (
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-title text-ink">
                Export {job.exportVersion}
              </p>
              <p className="mt-1 text-body-sm text-ink-3">
                A frozen set of accepted versions, packaged with schema, quality
                report and manifest.
              </p>
            </div>
            <ButtonLink href={`/workspace/buyer/jobs/${job.id}/export`}>
              <Download className="h-4 w-4" />
              View export
            </ButtonLink>
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon={FileText}
            title="No export yet"
            description="An export can be generated once accepted versions exist. It is built from a frozen snapshot and versioned."
            action={
              <ButtonLink href={`/workspace/buyer/jobs/${job.id}/export`} variant="secondary">
                Review export readiness
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            }
          />
        )}
      </section>

      <div className="mt-6 flex items-center gap-3">
        <Button variant="ghost" disabled title="Pausing requires a connected platform API">
          Pause job
        </Button>
        <span className="text-caption text-ink-4">
          Lifecycle actions require a connected platform API.
        </span>
      </div>
    </>
  );
}
