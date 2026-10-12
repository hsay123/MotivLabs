import { workflow } from "@/lib/content/landing";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Unified workflow.
 *
 * A single rail with five nodes: horizontal on desktop, vertical on
 * mobile. The connecting line is static — no animated connectors, no
 * repeated card chrome — so the sequence reads in one pass.
 */
export function WorkflowSequence() {
  return (
    <Section tone="muted" spacing="default" contained={false}>
      <Container size="default">
        <SectionHeading
          eyebrow={workflow.eyebrow}
          title={workflow.heading}
          description={workflow.support}
        />

        {/* ---- Desktop: horizontal rail ---------------------------- */}
        <ol className="relative mt-14 hidden lg:grid lg:grid-cols-5">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-[13px] h-px bg-line-strong"
          />
          {workflow.steps.map((step, index) => (
            <li key={step.id} className="relative pr-6 last:pr-0">
              <div className="flex items-center gap-3">
                <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-[11px] font-medium text-ink-2 tnum">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-display text-title text-ink">{step.label}</h3>
              <p className="mt-2 text-body-sm text-ink-3">{step.detail}</p>
              <div className="mt-3">
                <Badge tone="outline">{step.state}</Badge>
              </div>
            </li>
          ))}
        </ol>

        {/* ---- Mobile: vertical flow ------------------------------- */}
        <ol className="relative mt-10 lg:hidden">
          <div
            aria-hidden
            className="absolute bottom-3 left-[13px] top-3 w-px bg-line-strong"
          />
          {workflow.steps.map((step, index) => (
            <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
              <span className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-[11px] font-medium text-ink-2 tnum">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-title text-ink">{step.label}</h3>
                <p className="mt-1.5 text-body-sm text-ink-3">{step.detail}</p>
                <div className="mt-2.5">
                  <Badge tone="outline">{step.state}</Badge>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
