import type { Metadata } from "next";
import Link from "next/link";
import { readContributorTasks } from "@/lib/api/read";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { ArrowRight, Clock, FileText, Info, Sparkle } from "@/components/ui/icons";
import { formatDate, formatUsd } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Contributor tasks" };

export default async function ContributorTasksPage() {
  const { data: tasks } = await readContributorTasks();

  const available = tasks.filter((task) => task.status === "available");
  const active = tasks.filter((task) =>
    ["draft", "revision_requested", "assigned"].includes(task.status),
  );
  const recent = tasks.filter((task) =>
    ["submitted", "in_review", "accepted", "paid"].includes(task.status),
  );

  const potential = available.reduce((sum, task) => sum + task.rewardUsd, 0);

  return (
    <>
      <WorkspaceHeader
        eyebrow="Contributor"
        title="Available tasks"
        description="Reward, estimated effort, clip length and the acceptance rubric are shown before you claim anything. Claims are atomic — no two people annotate the same task."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Available now"
          value={String(available.length)}
          hint={formatUsd(potential) + " if all are claimed and accepted"}
        />
        <Stat
          label="Ready to resume"
          value={String(active.length)}
          hint="Drafts and correction requests"
        />
        <Stat
          label="Awaiting outcome"
          value={String(recent.length)}
          hint="Submitted, in review or settled"
        />
      </div>

      {/* Resume / correction */}
      {active.length > 0 ? (
        <section className="mt-8">
          <h2 className="font-display text-title text-ink">Resume your work</h2>
          <ul className="mt-4 grid gap-4 lg:grid-cols-2">
            {active.map((task) => (
              <li key={task.id}>
                <article className="flex h-full flex-col rounded-xl border border-pending-line bg-surface p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] text-ink-4">
                      {task.id}
                    </span>
                    <StatusChip status={task.status} />
                  </div>
                  <h3 className="mt-3 font-display text-title text-ink">
                    {task.clipLabel}
                  </h3>
                  {task.status === "revision_requested" ? (
                    <p className="mt-2 text-body-sm text-pending-fg">
                      A correction was requested. The reviewer&apos;s reason is shown
                      in the workspace — resubmitting creates a new version.
                    </p>
                  ) : (
                    <p className="mt-2 text-body-sm text-ink-3">
                      A draft is saved. Nothing is submitted until you submit it.
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                    <span className="text-caption text-ink-4">
                      Resume by {formatDate(task.deadline)}
                    </span>
                    <ButtonLink
                      href={`/workspace/contributor/tasks/${task.id}`}
                      size="sm"
                    >
                      Open workspace
                      <ArrowRight className="h-4 w-4" />
                    </ButtonLink>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Available */}
      <section className="mt-8">
        <h2 className="font-display text-title text-ink">Open tasks</h2>
        {available.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={FileText}
            title="No tasks are available right now"
            description="Eligible tasks appear here based on your qualification and access level. This empty state is real, not a placeholder."
          />
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-collapse text-left text-body-sm">
                <thead>
                  <tr className="border-b border-line text-caption uppercase tracking-[0.05em] text-ink-4">
                    <th scope="col" className="px-5 py-3 font-medium">Clip</th>
                    <th scope="col" className="px-5 py-3 font-medium">Job</th>
                    <th scope="col" className="px-5 py-3 font-medium">Effort</th>
                    <th scope="col" className="px-5 py-3 font-medium">Difficulty</th>
                    <th scope="col" className="px-5 py-3 font-medium">Due</th>
                    <th scope="col" className="px-5 py-3 text-right font-medium">Reward</th>
                    <th scope="col" className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {available.map((task) => (
                    <tr key={task.id} className="border-b border-line last:border-b-0">
                      <td className="px-5 py-4 align-top">
                        <span className="font-medium text-ink">
                          {task.clipLabel}
                        </span>
                        <p className="mt-0.5 font-mono text-[11px] text-ink-4">
                          {task.id} · {task.schemaVersion}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top font-mono text-[12px] text-ink-3">
                        {task.jobId}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className="inline-flex items-center gap-1.5 text-ink-3">
                          <Clock aria-hidden className="h-3.5 w-3.5" />~
                          {task.estimatedMinutes} min
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <Badge
                          tone={task.difficulty === "advanced" ? "accent" : "neutral"}
                        >
                          {task.difficulty === "advanced" ? (
                            <Sparkle className="h-3 w-3" />
                          ) : null}
                          {task.difficulty}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 align-top text-ink-3">
                        {formatDate(task.deadline)}
                      </td>
                      <td className="px-5 py-4 text-right align-top font-medium text-ink tnum">
                        {formatUsd(task.rewardUsd)}
                      </td>
                      <td className="px-5 py-4 text-right align-top">
                        <Link
                          href={`/workspace/contributor/tasks/${task.id}`}
                          className="inline-flex items-center gap-1 text-caption font-medium text-accent-700 hover:underline"
                        >
                          Claim
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <p className="mt-6 flex items-start gap-2 text-caption text-ink-4">
        <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Claiming requires a connected platform API. Opening a task in this build
        shows the workspace with sample data.
      </p>
    </>
  );
}
