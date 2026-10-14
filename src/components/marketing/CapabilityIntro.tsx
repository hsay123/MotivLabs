import { capabilityIntro } from "@/lib/content/landing";
import { media } from "@/lib/media/assets";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { BentoCard } from "@/components/ui/BentoCard";

/**
 * Capability Introduction — Encord Bento Box Style.
 *
 * Large full-width feature card followed by a 2-column grid of feature cards.
 */
export function CapabilityIntro() {
  return (
    <Section tone="canvas" spacing="loose" contained={false}>
      <Container size="wide">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-24 max-w-3xl mx-auto">
          <Eyebrow>{capabilityIntro.eyebrow}</Eyebrow>
          <h2 className="mt-6 text-display-lg text-[#000000] font-bold tracking-[-0.04em] leading-[1.0]">
            {capabilityIntro.heading}
          </h2>
          <p className="mt-6 text-body-lg text-[#333333] max-w-2xl mx-auto leading-relaxed">
            {capabilityIntro.support}
          </p>
        </div>

        {/* Bento Grid — Full width featured card + 2 column grid */}
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
          {/* Large Featured Card - Full Width */}
          <div className="bento-card lg:col-span-2 relative overflow-hidden">
            <div className="absolute inset-0">
              <MediaPlaceholder
                asset={media.capabilityOverview}
                tone="light"
                sizes="(min-width: 1280px) 1200px, 100vw"
              />
            </div>
            <div className="relative z-10 p-8 lg:p-12 lg:pt-16 lg:pb-12 lg:pl-16">
              <div className="max-w-xl">
                <Eyebrow className="text-white/80">{capabilityIntro.eyebrow}</Eyebrow>
                <h3 className="mt-4 text-display-md text-white font-bold tracking-[-0.03em] leading-[1.05]">
                  {capabilityIntro.heading}
                </h3>
                <p className="mt-4 text-body-lg text-white/90 leading-relaxed max-w-xl">
                  {capabilityIntro.support}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Card 1 */}
          <div className="bento-card flex flex-col">
            <div className="flex-1">
              <h3 className="text-2xl lg:text-3xl font-bold text-[#000000] tracking-[-0.02em] mb-4">
                Annotate & Structure
              </h3>
              <p className="text-[#333333] leading-relaxed mb-6">
                Turn images and video into structured labels. Contributors work inside a focused browser workspace drawing regions on still images or placing action boundaries against timecode.
              </p>
              <ul className="space-y-3 text-[#333333]">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Image region and video action annotation</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Object boxes or action labels with timestamps</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Task-specific schema per project</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Contributor instructions in context</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Versioned submissions — corrections never overwrite history</span>
                </li>
              </ul>
            </div>
            <a href="#" className="mt-6 text-sm font-medium text-[#CCFF00] hover:text-[#B8E600] inline-flex items-center gap-1.5">
              Learn more
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4-4 4" />
              </svg>
            </a>
          </div>

          {/* Feature Card 2 */}
          <div className="bento-card flex flex-col">
            <div className="flex-1">
              <h3 className="text-2xl lg:text-3xl font-bold text-[#000000] tracking-[-0.02em] mb-4">
                Review & Validate
              </h3>
              <p className="text-[#333333] leading-relaxed mb-6">
                Independent review against a rubric you define. Server-side validator checks schema first, then a reviewer compares the submission against source media and records a reason-coded decision.
              </p>
              <ul className="space-y-3 text-[#333333]">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Rubric-based evaluation with published reason codes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Accept, request correction, or reject with stated reason</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Full review history: reviewer, decision, notes, rubric version</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Quality reports with acceptance and correction counts</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Accepted-version tracking for reproducible delivery</span>
                </li>
              </ul>
            </div>
            <a href="#" className="mt-6 text-sm font-medium text-[#CCFF00] hover:text-[#B8E600] inline-flex items-center gap-1.5">
              Learn more
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4-4 4" />
              </svg>
            </a>
          </div>

          {/* Feature Card 3 */}
          <div className="bento-card flex flex-col">
            <div className="flex-1">
              <h3 className="text-2xl lg:text-3xl font-bold text-[#000000] tracking-[-0.02em] mb-4">
                Deliver & Verify
              </h3>
              <p className="text-[#333333] leading-relaxed mb-6">
                Accepted work becomes a dataset you can trace. Export frozen sets of accepted versions with schema, quality report, and provenance manifest mapping back to decisions.
              </p>
              <ul className="space-y-3 text-[#333333]">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>JSONL and CSV exports of accepted records only</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Schema and version information shipped with the data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Quality report with stated definitions and sample sizes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Provenance manifest: source references, checksums, export version</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                  <span>Settlement status shown where payment records exist</span>
                </li>
              </ul>
            </div>
            <a href="#" className="mt-6 text-sm font-medium text-[#CCFF00] hover:text-[#B8E600] inline-flex items-center gap-1.5">
              Learn more
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4-4 4" />
              </svg>
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}