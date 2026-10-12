import type { Metadata } from "next";
import Link from "next/link";
import { readAuditEvents, readJobs, readQualityMetrics, readReceipts } from "@/lib/api/read";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Progress } from "@/components/product/Progress";
import { ButtonLink } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowRight, Database, FileText, Info } from "@/components/ui/icons";
import { formatCount, formatDate, formatPercent, formatUsd } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Buyer dashboard",
};

export default async function BuyerDashboard() {
  const { data: jobs } = await readJobs();
  const { data: metrics } = await readQualityMetrics("ML-1041");
  const { data: receipts } = await readReceipts();
  const { data: events } = await readAuditEvents();

  const active = jobs.filter((job) => job.status === "active");
  const inReview = jobs.reduce((sum, job) => sum + job.taskCounts.inReview, 0);
  const needsRevision = jobs.reduce((sum, job) => sum + job.taskCounts.needsRevision, 0);
  const paid = jobs.reduce((sum, job) => sum + job.spend.paidUsd, 0);

  const firstPass = metrics.find((m) => m.key === "first_pass_acceptance");

  return (
    <>
      <WorkspaceHeader
        eyebrow="Buyer"
        title="Dashboard"
        description="What is in flight, what the quality looks like, and what has been settled — reconciled to accepted work only."
        actions={
          <ButtonLink href="/workspace/buyer/new">New job</ButtonLink>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active jobs"
          value={formatCount(active.length)}
          hint={`${formatCount(jobs.length)} total`}
        />
        <Stat
          label="In review"
          value={formatCount(inReview)}
          hint="Submitted and awaiting a decision"
        />
        <Stat
          label="Needs revision"
          value={formatCount(needsRevision)}
          hint="Returned to contributors"
        />
        <Stat
          label="Settled"
          value={formatUsd(paid)}
          hint="Reconciled to real settlement records"
        />
      </div>

      {/* Jobs */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-title text-ink">Jobs</h2>
          <span className="text-caption text-ink-4">
            {firstPass ? (
              <>
                First-pass acceptance {formatPercent(firstPass.value)} ·{" "}
                {firstPass.sampleSize} reviewed
              </>
            ) : null}
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left text-body-sm">
              <thead>
                <tr className="border-b border-line text-caption uppercase tracking-[0.05em] text-ink-4">
                  <th scope="col" className="px-5 py-3 font-medium">Job</th>
                  <th scope="col" className="px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-5 py-3 font-medium">Progress</th>
                  <th scope="col" className="px-5 py-3 font-medium">Quality</th>
                  <th scope="col" className="px-5 py-3 text-right font-medium">Settled</th>
                  <th scope="col" className="px-5 py-3 font-medium">Deadline</th>
                  <th scope="col" className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-line last:border-b-0">
                    <td className="px-5 py-4 align-top">
                      <Link
                        href={`/workspace/buyer/jobs/${job.id}`}
                        className="font-medium text-ink hover:text-accent-700"
                      >
                        {job.title}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-ink-4">
                        {job.id} · {job.schemaVersion}
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <StatusChip status={job.status} />
                    </td>
                    <td className="min-w-[12rem] px-5 py-4 align-top">
                      <Progress
                        value={job.taskCounts.accepted}
                        max={job.taskCounts.total}
                        tone="success"
                        label={`${job.taskCounts.accepted} of ${job.taskCounts.total} tasks accepted`}
                      />
                      <p className="mt-1.5 text-caption text-ink-3 tnum">
                        {job.taskCounts.accepted}/{job.taskCounts.total} accepted ·{" "}
                        {job.taskCounts.inReview} in review
                      </p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <span className="text-ink-2">
                        {formatPercent(job.quality.firstPassAcceptance)}
                      </span>
                      <p className="mt-0.5 text-caption text-ink-4">
                        first-pass · n={job.quality.sampleSize}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right align-top tabular-nums text-ink-2">
                      {formatUsd(job.spend.paidUsd)}
                    </td>
                    <td className="px-5 py-4 align-top text-ink-3">
                      {formatDate(job.deadline)}
                    </td>
                    <td className="px-5 py-4 text-right align-top">
                      <Link
                        href={`/workspace/buyer/jobs/${job.id}`}
                        className="inline-flex items-center gap-1 text-caption font-medium text-accent-700 hover:underline"
                      >
                        Open
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Activity + receipts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <h2 className="font-display text-title text-ink">Recent activity</h2>
          <ul className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
            {events.map((event, index) => (
              <li
                key={event.id}
                className={
                  index === 0
                    ? "flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3.5"
                    : "flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line px-5 py-3.5"
                }
              >
                <span className="text-body-sm font-medium text-ink">
                  {event.action}
                </span>
                <span className="font-mono text-[11px] text-ink-4">
                  {event.entityLabel}
                </span>
                <span className="ml-auto text-caption text-ink-4">
                  {event.actorLabel} · {formatDate(event.at)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-start gap-2 text-caption text-ink-4">
            <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Audit events show actor labels only, never personal data.
          </p>
        </section>

        <section className="lg:col-span-5">
          <h2 className="font-display text-title text-ink">Provenance receipts</h2>
          {receipts.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={Database}
              title="No receipts yet"
              description="Receipts appear here once accepted work has a recorded provenance entry."
            />
          ) : (
            <ul className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
              {receipts.map((receipt, index) => (
                <li
                  key={receipt.id}
                  className={
                    index === 0
                      ? "px-5 py-3.5"
                      : "border-t border-line px-5 py-3.5"
                  }
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] text-ink">
                      {receipt.id}
                    </span>
                    <span className="text-caption text-ink-4">
                      {formatDate(receipt.recordedAt)}
                    </span>
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-ink-4">
                    {receipt.annotationHash}
                  </p>
                  <p className="mt-1 text-caption text-ink-3">
                    {receipt.taskId} · {receipt.schemaVersion} · {receipt.policyVersion}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/workspace/buyer/exports"
            className="mt-4 inline-flex items-center gap-1.5 text-body-sm font-medium text-accent-700 hover:underline"
          >
            <FileText className="h-4 w-4" />
            View exports
          </Link>
        </section>
      </div>
    </>
  );
}
