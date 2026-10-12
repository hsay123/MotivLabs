import type { Metadata } from "next";
import { readContributorTasks } from "@/lib/api/read";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { FileText, Info } from "@/components/ui/icons";
import { formatDate, formatUsd } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Submissions" };

export default async function ContributorSubmissionsPage() {
  const { data: tasks } = await readContributorTasks();

  const history = tasks.filter((task) =>
    ["submitted", "in_review", "accepted", "revision_requested", "rejected", "paid"].includes(
      task.status,
    ),
  );

  const accepted = history.filter((task) => ["accepted", "paid"].includes(task.status));
  const pending = history.filter((task) => ["submitted", "in_review"].includes(task.status));

  return (
    <>
      <WorkspaceHeader
        eyebrow="Contributor"
        title="Submissions"
        description="Your work history, with submitted, accepted and paid kept as three distinct states — a submission is not a payout."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Submitted" value={String(history.length)} hint="All versions you created" />
        <Stat label="Awaiting decision" value={String(pending.length)} hint="In validation or review" />
        <Stat
          label="Accepted"
          value={String(accepted.length)}
          hint="Eligible for payment under the policy"
        />
      </div>

      <section className="mt-8">
        {history.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No submissions yet"
            description="Once you submit a task it appears here with its review outcome and payment state."
          />
        ) : (
          <ul className="overflow-hidden rounded-xl border border-line bg-surface">
            {history.map((task, index) => (
              <li
                key={task.id}
                className={
                  index === 0
                    ? "grid gap-3 px-5 py-4 lg:grid-cols-12 lg:items-center"
                    : "grid gap-3 border-t border-line px-5 py-4 lg:grid-cols-12 lg:items-center"
                }
              >
                <div className="lg:col-span-5">
                  <p className="font-medium text-ink">{task.clipLabel}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-ink-4">
                    {task.id} · {task.jobId}
                  </p>
                </div>
                <div className="lg:col-span-3">
                  <StatusChip status={task.status} />
                </div>
                <div className="lg:col-span-2">
                  <p className="text-caption text-ink-4">Payout</p>
                  <div className="mt-1">
                    <StatusChip status={task.payout} />
                  </div>
                </div>
                <div className="lg:col-span-2 lg:text-right">
                  <p className="font-medium text-ink tnum">
                    {formatUsd(task.rewardUsd)}
                  </p>
                  <p className="text-caption text-ink-4">
                    Due {formatDate(task.deadline)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-line bg-surface p-4">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
        <p className="measure text-caption text-ink-3">
          A rejected submission does not become payable, but it is appealable —
          an independent adjudicator re-reviews with the evidence and records an
          outcome. Failed payments stay visibly unpaid rather than being retried
          into a duplicate.{" "}
          <Badge tone="neutral">Sample data</Badge>
        </p>
      </div>
    </>
  );
}
