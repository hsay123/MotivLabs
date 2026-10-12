import { productShowcase } from "@/lib/content/landing";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Product visual section.
 *
 * One large visual with minimal copy and three short wayfinding points.
 * The media is a labelled placeholder rather than an invented product
 * interface — the specification is explicit that we must not present
 * fabricated screenshots as shipped functionality.
 */
export function ProductShowcase() {
  return (
    <Section tone="canvas" spacing="default" contained={false}>
      <Container size="default">
        <SectionHeading
          eyebrow={productShowcase.eyebrow}
          title={productShowcase.heading}
          description={productShowcase.support}
          align="center"
          className="mx-auto"
        />

        <div className="mt-12">
          <MediaPlaceholder
            asset={productShowcase.asset}
            tone="dark"
            sizes="(min-width: 1280px) 1200px, 100vw"
            caption="Application media"
          />
        </div>

        <ul className="mt-10 grid gap-8 border-t border-line pt-8 sm:grid-cols-3">
          {productShowcase.points.map((point) => (
            <li key={point.title}>
              <h3 className="font-display text-title text-ink">{point.title}</h3>
              <p className="mt-2 text-body-sm text-ink-3">{point.body}</p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
