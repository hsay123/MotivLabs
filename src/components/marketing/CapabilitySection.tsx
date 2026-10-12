import type { Capability } from "@/lib/content/landing";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils/cn";

/**
 * Capability section.
 *
 * One component, three compositions — media right, media left, and a
 * full-width stacked treatment. Varying the composition is what stops
 * the page reading as an undifferentiated card deck.
 */
export function CapabilitySection({
  capability,
  tone,
}: {
  capability: Capability;
  tone: "canvas" | "surface";
}) {
  const { layout } = capability;

  if (layout === "stacked") {
    return (
      <Section
        tone={tone}
        spacing="default"
        id={capability.id}
        className="scroll-mt-28"
        divider={tone === "surface"}
      >
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <Eyebrow>
              {capability.index} — {capability.eyebrow}
            </Eyebrow>
            <h2 className="mt-5 text-display-md text-ink">{capability.heading}</h2>
          </div>
          <div className="lg:col-span-7 lg:pt-2">
            <p className="measure text-body-lg text-ink-2">{capability.body}</p>
          </div>
        </div>

        <ul className="mt-10 grid gap-x-8 gap-y-3 border-t border-line pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {capability.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2.5 text-body-sm text-ink-2">
              <span
                aria-hidden
                className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
              />
              {bullet}
            </li>
          ))}
        </ul>

        <div className="mt-10 lg:mt-12">
          <MediaPlaceholder
            asset={capability.asset}
            tone="light"
            sizes="(min-width: 1280px) 1200px, 100vw"
          />
          <ReplacementNote label={capability.placeholderLabel} />
        </div>
      </Section>
    );
  }

  const mediaRight = layout === "media-right";

  return (
    <Section
      tone={tone}
      spacing="default"
      id={capability.id}
      className="scroll-mt-28"
      divider={tone === "surface"}
    >
      <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
        <div
          className={cn(
            "lg:col-span-5",
            mediaRight ? "lg:order-1" : "lg:order-2",
          )}
        >
          <Eyebrow>
            {capability.index} — {capability.eyebrow}
          </Eyebrow>
          <h2 className="mt-5 text-display-md text-ink">{capability.heading}</h2>
          <p className="mt-5 measure text-body-lg text-ink-2">{capability.body}</p>

          <ul className="mt-8 space-y-3">
            {capability.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-2.5 text-body-sm text-ink-2"
              >
                <span
                  aria-hidden
                  className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500"
                />
                {bullet}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <Badge tone="outline">Schema: action-segments-v1</Badge>
          </div>
        </div>

        <div
          className={cn(
            "lg:col-span-7",
            mediaRight ? "lg:order-2" : "lg:order-1",
          )}
        >
          <MediaPlaceholder
            asset={capability.asset}
            tone="light"
            sizes="(min-width: 1024px) 700px, 100vw"
          />
          <ReplacementNote label={capability.placeholderLabel} />
        </div>
      </div>
    </Section>
  );
}

/**
 * Names the exact asset that should replace the placeholder above it.
 * Purely a build-time affordance — remove with the placeholder once real
 * media is wired in.
 */
function ReplacementNote({ label }: { label: string }) {
  return (
    <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-ink-4">
      <span aria-hidden className="inline-block h-3 w-px bg-line-strong" />
      {label}
    </p>
  );
}
