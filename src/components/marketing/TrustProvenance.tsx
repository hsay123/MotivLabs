import type { ComponentType, SVGProps } from "react";
import { trust } from "@/lib/content/landing";
import { media } from "@/lib/media/assets";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Check, Layers, Lock, Receipt, Scale } from "@/components/ui/icons";

const iconMap: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  layers: Layers,
  scale: Scale,
  receipt: Receipt,
  lock: Lock,
  check: Check,
};

/**
 * Trust and provenance.
 *
 * Describes the trust model as concrete artifacts — versioned records,
 * review decisions, a manifest, private media, settlement state. No
 * fake transaction hashes, verification badges or certification claims.
 */
export function TrustProvenance() {
  return (
    <Section tone="night" spacing="default">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow={trust.eyebrow}
            title={trust.heading}
            description={trust.support}
            tone="dark"
          />
          <div className="mt-10">
            <MediaPlaceholder
              asset={media.provenanceDiagram}
              tone="dark"
              sizes="(min-width: 1024px) 520px, 100vw"
            />
          </div>
        </div>

        <ul className="lg:col-span-7">
          {trust.items.map((item, index) => {
            const Icon = iconMap[item.icon] ?? Check;
            return (
              <li
                key={item.id}
                className={
                  index === 0
                    ? "border-t border-night-3 py-6 first:pt-0 lg:first:pt-0"
                    : "border-t border-night-3 py-6"
                }
              >
                <div className="flex gap-4">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line-inverse bg-white/5 text-accent-300"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-title text-night-ink">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 max-w-2xl text-body-sm text-night-ink-2">
                      {item.body}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Section>
  );
}
