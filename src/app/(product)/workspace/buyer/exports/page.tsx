import type { Metadata } from "next";
import Link from "next/link";
import { readExports } from "@/lib/api/read";
import { WorkspaceHeader } from "@/components/product/WorkspaceHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { Download, FileText, Info } from "@/components/ui/icons";
import { formatCount, formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Exports" };

export default async function BuyerExportsPage() {
  const { data: exports } = await readExports();

  return (
    <>
      <WorkspaceHeader
        eyebrow="Buyer"
        title="Exports"
        description="Every delivery is versioned and immutable. A regeneration produces a new version rather than replacing one you have already validated."
      />

      {exports.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No exports yet"
          description="Exports appear here once a job has accepted versions to package."
        />
      ) : (
        <ul className="space-y-5">
          {exports.map((pkg) => (
            <li
              key={pkg.id}
              className="overflow-hidden rounded-xl border border-line bg-surface"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-medium text-ink">
                    {pkg.id}
                  </span>
                  <StatusChip status={pkg.state} />
                  <span className="text-caption text-ink-4">
                    {pkg.format.toUpperCase()} · {pkg.version}
                  </span>
                </div>
                <span className="text-caption text-ink-4">
                  Job{" "}
                  <Link
                    href={`/workspace/buyer/jobs/${pkg.jobId}`}
                    className="font-mono text-ink-3 hover:text-accent-700"
                  >
                    {pkg.jobId}
                  </Link>
                </span>
              </div>

              <div className="grid gap-6 px-5 py-4 lg:grid-cols-12">
                <dl className="grid grid-cols-2 gap-4 lg:col-span-7 sm:grid-cols-4">
                  {[
                    ["Records", formatCount(pkg.records)],
                    ["Schema", pkg.schemaVersion],
                    ["Generated", formatDateTime(pkg.generatedAt)],
                    [
                      "Access expires",
                      pkg.state === "expired" ? "Expired" : formatDateTime(pkg.accessExpiresAt),
                    ],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-caption text-ink-4">{label}</dt>
                      <dd className="mt-1 text-body-sm font-medium text-ink">{value}</dd>
                    </div>
                  ))}
                  <div className="col-span-2 sm:col-span-4">
                    <dt className="text-caption text-ink-4">Checksum</dt>
                    <dd className="mt-1 font-mono text-[12px] text-ink-3">
                      {pkg.checksum}
                    </dd>
                  </div>
                </dl>

                <div className="lg:col-span-5">
                  <p className="text-caption uppercase tracking-[0.06em] text-ink-4">
                    Files
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {pkg.files.map((file) => (
                      <li
                        key={file.name}
                        className="flex items-baseline justify-between gap-3 text-body-sm"
                      >
                        <code className="font-mono text-[12px] text-ink">
                          {file.name}
                        </code>
                        <span className="text-caption text-ink-4 tnum">
                          {(file.bytes / 1024).toFixed(0)} KB
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4">
                    {pkg.state === "ready" ? (
                      <ButtonLink
                        href={`/workspace/buyer/jobs/${pkg.jobId}/export`}
                        variant="secondary"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </ButtonLink>
                    ) : (
                      <span className="text-caption text-ink-4">
                        This link has expired. Regenerate to create a new version.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 flex items-start gap-2 text-caption text-ink-4">
        <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Downloads in this build are not wired to storage; the records above are
        labelled sample data.
      </p>
    </>
  );
}
