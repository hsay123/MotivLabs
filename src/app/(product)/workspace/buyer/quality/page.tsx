import type { Metadata } from "next";
import { readQualityMetrics } from "@/lib/api/read";
import { WorkspaceHeader } from "@/components/product/WorkspaceHeader";
import { Info } from "@/components/ui/icons";
import { formatCount } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Quality" };

export default async function BuyerQualityPage() {
  const { data: metrics } = await readQualityMetrics("ML-1041");

  const renderValue = (value: number | null, unit: string) => {
    if (value === null) return "Not enough data";
    if (unit === "percent") return `${value}%`;
    if (unit === "minutes") return `${value} min`;
    return formatCount(value);
  };

  return (
    <>
      <WorkspaceHeader
        eyebrow="Buyer"
        title="Quality"
        description="Every figure states its definition, sample size and time window. Where the sample is too small, it says so rather than showing a number."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className="rounded-xl border border-line bg-surface p-5"
          >
            <p className="text-caption uppercase tracking-[0.06em] text-ink-4">
              {metric.label}
            </p>
            <p className="mt-2 font-display text-[1.75rem] font-medium tracking-[-0.02em] text-ink tnum">
              {metric.value === null ? (
                <span className="text-body-sm font-normal text-ink-4">
                  Not enough data
                </span>
              ) : (
                renderValue(metric.value, metric.unit)
              )}
            </p>
            <p className="mt-3 text-caption text-ink-3">{metric.definition}</p>
            <p className="mt-3 border-t border-line pt-3 text-caption text-ink-4">
              Sample size: {formatCount(metric.sampleSize)} · Window: current
              cohort
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-start gap-2.5 rounded-lg border border-line bg-surface p-4">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
        <p className="measure text-caption text-ink-3">
          We deliberately do not publish a single universal reputation score. A
          composite number hides the sample size behind it and makes quality
          impossible to reason about. Correction rate is also broken down by
          rubric version, so a rubric change does not silently flatter the
          trend.
        </p>
      </div>
    </>
  );
}
