import type { Metadata } from "next";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Confirm } from "@/components/product/Confirm";
import { Scale } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Disputes" };

/**
 * Disputes / appeals.
 *
 * No appeals exist in the sample fixtures because the fixtures deliberately
 * do not invent review outcomes beyond what is needed to demonstrate the
 * queue. The screen therefore shows a real empty state, matching the
 * specification's requirement that empty states never fake activity.
 */
export default function ReviewerDisputesPage() {
  return (
    <>
      <WorkspaceHeader
        eyebrow="Reviewer"
        title="Disputes and appeals"
        description="Appeals are re-reviewed independently, with the evidence and reason codes attached. An adjudicator upholds, reverses, or requests a correction — and the outcome is recorded."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open appeals" value="0" hint="No appeals recorded" />
        <Stat label="Awaiting adjudication" value="0" hint="Requires elevated permission" tone="muted" />
        <Stat label="Resolved this window" value="0" hint="Window: current cohort" tone="muted" />
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <Badge tone="accent">
            <Scale className="h-3 w-3" />
            Adjudicator
          </Badge>
          <span className="text-caption text-ink-4">
            Adjudication requires elevated QA permission
          </span>
        </div>

        <EmptyState
          icon={Scale}
          title="No appeals in the queue"
          description="This is an honest empty state: the sample fixtures contain no appeal, so none is shown. In production, appeals appear here with the original decision, the contributor's reason and the evidence attached."
        />
      </div>

      <Confirm label="Adjudication and audit permissions are not modelled in this build; the screen states the intended behaviour rather than simulating it." />
    </>
  );
}
