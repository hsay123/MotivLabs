import type { Metadata } from "next";
import { readContributorTasks, readReceipts } from "@/lib/api/read";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { Confirm } from "@/components/product/Confirm";
import { Info } from "@/components/ui/icons";
import { formatDate, formatUsd } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Earnings" };

export default async function ContributorEarningsPage() {
  const [{ data: tasks }, { data: receipts }] = await Promise.all([
    readContributorTasks(),
    readReceipts(),
  ]);

  const paid = tasks.filter((task) => task.status === "paid");
  const eligible = tasks.filter(
    (task) => task.status === "accepted" && task.payout === "eligible",
  );
  const pending = tasks.filter((task) => task.payout === "pending");

  const paidTotal = paid.reduce((sum, task) => sum + task.rewardUsd, 0);
  const eligibleTotal = eligible.reduce((sum, task) => sum + task.rewardUsd, 0);
  const pendingTotal = pending.reduce((sum, task) => sum + task.rewardUsd, 0);

  return (
    <>
      <WorkspaceHeader
        eyebrow="Contributor"
        title="Earnings"
        description="Eligible, pending and confirmed are shown separately. Only a confirmed settlement counts as paid."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Confirmed paid"
          value={formatUsd(paidTotal)}
          hint={`${paid.length} tasks settled`}
        />
        <Stat
          label="Eligible, unsettled"
          value={formatUsd(eligibleTotal)}
          hint="Accepted; awaiting a settlement batch"
          tone="muted"
        />
        <Stat
          label="Pending"
          value={formatUsd(pendingTotal)}
          hint="Accepted but not yet queued for settlement"
          tone="muted"
        />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-title text-ink">Settlement records</h2>
        <p className="mt-2 flex items-start gap-2 text-caption text-ink-3">
          <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A transaction reference is shown only where a real transaction exists.
          Where a settlement is not implemented on-chain, the record states the
          off-chain status instead.
        </p>

        <ul className="mt-4 overflow-hidden rounded-xl border border-line bg-surface">
          {receipts.map((receipt, index) => (
            <li
              key={receipt.id}
              className={
                index === 0
                  ? "grid gap-2 px-5 py-4 sm:grid-cols-12 sm:items-center"
                  : "grid gap-2 border-t border-line px-5 py-4 sm:grid-cols-12 sm:items-center"
              }
            >
              <div className="sm:col-span-4">
                <p className="font-mono text-[12px] text-ink">{receipt.id}</p>
                <p className="mt-0.5 text-caption text-ink-4">
                  {receipt.taskId} · {formatDate(receipt.recordedAt)}
                </p>
              </div>
              <div className="sm:col-span-4">
                <p className="font-mono text-[11px] text-ink-3">
                  {receipt.annotationHash}
                </p>
                <p className="mt-0.5 text-caption text-ink-4">
                  {receipt.policyVersion}
                </p>
              </div>
              <div className="sm:col-span-4 sm:text-right">
                {receipt.settlementTxHash ? (
                  <>
                    <Badge tone="accent">On-chain</Badge>
                    <p className="mt-1 font-mono text-[11px] text-ink-3">
                      {receipt.settlementTxHash}
                    </p>
                  </>
                ) : (
                  <>
                    <Badge tone="neutral">Off-chain</Badge>
                    <p className="mt-1 text-caption text-ink-4">
                      No on-chain transaction for this record.
                    </p>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Confirm label="Sample data. Amounts reflect accepted work only; nothing here is a real payment." />
    </>
  );
}
