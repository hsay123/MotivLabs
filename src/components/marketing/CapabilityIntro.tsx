import { capabilityIntro } from "@/lib/content/landing";
import { media } from "@/lib/media/assets";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { Eyebrow } from "@/components/ui/SectionHeading";

/**
 * Capability introduction.
 *
 * An editorial two-column statement followed by one wide media surface —
 * deliberately not a grid of cards. The whitespace is the point.
 */
export function CapabilityIntro() {
  return (
    <Section tone="canvas" spacing="loose" contained={false}>
      <Container size="default">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-6">
            <Eyebrow>{capabilityIntro.eyebrow}</Eyebrow>
            <h2 className="mt-5 text-display-lg text-ink">
              {capabilityIntro.heading}
            </h2>
          </div>
          <div className="lg:col-span-6 lg:pt-3">
            <p className="measure text-body-lg text-ink-2">
              {capabilityIntro.support}
            </p>
          </div>
        </div>

        <div className="mt-12 lg:mt-16">
          <MediaPlaceholder
            asset={media.capabilityOverview}
            tone="light"
            sizes="(min-width: 1280px) 1200px, 100vw"
          />
        </div>
      </Container>
    </Section>
  );
}
