"use client";

import Link from "next/link";
import { useEarnings } from "@/lib/api/live";
import { QueryView, InfoNote } from "@/components/product/AsyncView";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { FileText } from "@/components/ui/icons";
import { formatDate, formatUsd } from "@/lib/utils/format";

/**
 * Submission history.
 *
 * The API exposes a contributor's own submissions through `GET /api/earnings`,
 * which returns one row per task (the latest version) with its status and
 * reward reference. There is no separate submissions-list endpoint, so this
 * screen reads that real source rather than inventing history.
 */
export function ContributorSubmissions() {
  const earnings = useEarnings();

  return (
    <>
      <WorkspaceHeader
        eyebrow="Contributor"
        title="Submissions"
        description="Every submission is an immutable version. Corrections append a new version rather than editing one already delivered."
      />

      <QueryView query={earnings}>
        {(summary) => {
          const accepted = summary.tasks.filter((task) =>
            ["accepted", "paid"].includes(task.status),
          );
          const pending = summary.tasks.filter((task) =>
            ["submitted", "appealed"].includes(task.status),
          );

          return (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat
                  label="Accepted"
                  value={String(summary.total_accepted)}
                  hint="Versions accepted or paid"
                />
                <Stat
                  label="Awaiting outcome"
                  value={String(pending.length)}
                  hint="Submitted or under appeal"
                  tone="muted"
                />
                <Stat
                  label="Pending amount"
                  value={formatUsd(Number(summary.total_pending))}
                  hint="Accepted but not yet settled"
                  tone="muted"
                />
              </div>

              {summary.tasks.length === 0 ? (
                <div className="mt-6">
                  <EmptyState
                    icon={FileText}
                    title="No submissions yet"
                    description="Claim a task from the queue and submit an annotation; it will appear here."
                  />
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-xl border border-line bg-surface">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[42rem] border-collapse text-left text-body-sm">
                      <thead>
                        <tr className="border-b border-line text-caption uppercase tracking-[0.05em] text-ink-4">
                          <th scope="col" className="px-5 py-3 font-medium">
                            Job
                          </th>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Status
                          </th>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Reward
                          </th>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Submitted
                          </th>
                          <th scope="col" className="px-5 py-3 font-medium">
                            Settlement
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.tasks.map((task) => (
                          <tr key={task.task_id} className="border-b border-line last:border-b-0">
                            <td className="px-5 py-3">
                              <Link
                                href={`/workspace/contributor/tasks/${task.task_id}`}
                                className="text-ink hover:text-accent-700"
                              >
                                {task.job_title || task.task_id.slice(0, 8)}
                              </Link>
                            </td>
                            <td className="px-5 py-3">
                              <StatusChip status={task.status} />
                            </td>
                            <td className="px-5 py-3 text-ink-3 tnum">
                              {formatUsd(Number(task.reward))}
                            </td>
                            <td className="px-5 py-3 text-ink-3">
                              {formatDate(task.submitted_at)}
                            </td>
                            <td className="px-5 py-3 font-mono text-[11px] text-ink-4">
                              {task.tx_hash ? `${task.tx_hash.slice(0, 10)}…` : "Off-chain record"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {accepted.length === 0 && summary.tasks.length > 0 ? (
                <InfoNote>
                  Nothing has been accepted yet. Only accepted work becomes
                  eligible for settlement.
                </InfoNote>
              ) : null}
            </>
          );
        }}
      </QueryView>

      <InfoNote>
        A submission is a frozen version; the platform delivers the accepted
        version only. Where a task shows an off-chain settlement record, no
        on-chain transaction is implied.
      </InfoNote>
    </>
  );
}
