import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readJob } from "@/lib/api/read";
import { WorkspaceHeader, Stat } from "@/components/product/WorkspaceHeader";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { StatusChip } from "@/components/ui/StatusChip";
import { Info, Lock } from "@/components/ui/icons";
import { formatCount, formatUsd } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Export" };

const packageFiles = [
  { name: "annotations.jsonl", note: "Accepted records, one JSON object per line." },
  { name: "annotations.csv", note: "Flattened interval rows." },
  { name: "schema.json", note: "The schema definition the records conform to." },
  { name: "quality_report.json", note: "Acceptance and correction counts." },
  { name: "manifest.json", note: "Versions, source references and checksum." },
  { name: "README.md", note: "Field notes and reading guidance." },
];

export default async function JobExportPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const { data: job } = await readJob(jobId);
  if (!job) notFound();

  const ready = job.taskCounts.accepted > 0;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-caption text-ink-4">
        <Link href="/workspace/buyer" className="hover:text-ink">
          Dashboard
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <Link href={`/workspace/buyer/jobs/${job.id}`} className="hover:text-ink">
          {job.id}
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span>Export</span>
      </nav>

      <WorkspaceHeader
        eyebrow={`${job.id} · delivery`}
        title="Dataset export"
        description="An export is generated from a frozen set of accepted versions only. It is versioned — regeneration never silently replaces a prior deliverable."
        actions={
          job.exportVersion ? (
            <Badge tone="accent">Latest: {job.exportVersion}</Badge>
          ) : (
            <StatusChip status="generating" />
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Accepted versions"
          value={formatCount(job.taskCounts.accepted)}
          hint="Eligible for the frozen set"
        />
        <Stat
          label="Pending review"
          value={formatCount(job.taskCounts.inReview)}
          hint="Excluded until accepted"
        />
        <Stat
          label="Needs revision"
          value={formatCount(job.taskCounts.needsRevision)}
          hint="Excluded until accepted"
        />
        <Stat
          label="Settled to date"
          value={formatUsd(job.spend.paidUsd)}
          hint={job.exportVersion ? `Last export ${job.exportVersion}` : "No export yet"}
        />
      </div>

      <section className="mt-6 rounded-xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-title text-ink">
            Export package contents
          </h2>
          <span className="font-mono text-[12px] text-ink-4">
            {job.schemaVersion}
          </span>
        </div>
        <ul className="mt-4 border-t border-line">
          {packageFiles.map((file) => (
            <li
              key={file.name}
              className="flex flex-col gap-1 border-b border-line py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
            >
              <code className="font-mono text-[13px] text-ink">{file.name}</code>
              <span className="text-caption text-ink-3 sm:text-right">
                {file.note}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-4 rounded-lg border border-line bg-canvas p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
            <p className="text-caption text-ink-3">
              Packages are stored privately. Download access is authenticated and
              expires; access events are logged.
            </p>
          </div>
          <ButtonLink
            href={`/workspace/buyer/jobs/${job.id}`}
            variant="secondary"
            className="shrink-0"
          >
            Back to job
          </ButtonLink>
        </div>
      </section>

      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-info-line bg-info-bg p-4">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-info-fg" />
        <p className="measure text-caption text-info-fg">
          {ready
            ? "Generating and downloading an export requires a connected platform API. In this build the readiness view above is sample data."
            : "There are no accepted versions yet, so there is nothing to package. The readiness view above is sample data."}
        </p>
      </div>
    </>
  );
}
