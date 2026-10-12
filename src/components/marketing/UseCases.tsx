import { useCases } from "@/lib/content/landing";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils/cn";

/**
 * Physical AI use cases.
 *
 * Four items on an asymmetric grid — 7/5 then 5/7 — so each reads as a
 * distinct case rather than a uniform tile. Copy stays inside what the
 * current schema actually supports.
 */
const spans = [
  "lg:col-span-7",
  "lg:col-span-5",
  "lg:col-span-5",
  "lg:col-span-7",
] as const;

export function UseCases() {
  return (
    <Section tone="surface" spacing="default" divider contained={false}>
      <Container size="default">
        <SectionHeading
          eyebrow={useCases.eyebrow}
          title={useCases.heading}
          description={useCases.support}
        />

        <ul className="mt-12 grid gap-6 lg:grid-cols-12 lg:gap-8">
          {useCases.items.map((item, index) => (
            <li
              key={item.id}
              id={item.id}
              className={cn("scroll-mt-28", spans[index])}
            >
              <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-line bg-canvas">
                <MediaPlaceholder
                  asset={item.asset}
                  tone="light"
                  className="rounded-none border-0 border-b"
                  sizes="(min-width: 1024px) 700px, 100vw"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-display-sm text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-body-sm text-ink-3">{item.body}</p>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-caption text-ink-3"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-3xl text-caption text-ink-4">
          Depth, LiDAR, point clouds and synchronised multi-sensor annotation are
          not supported yet. They are on the roadmap and are listed here only as
          future scope — not current capability.
        </p>
      </Container>
    </Section>
  );
}
