import { credibilityCategories } from "@/lib/content/landing";
import { Container } from "@/components/ui/Container";
import { Info } from "@/components/ui/icons";

/**
 * Credibility strip.
 *
 * Carries workflow categories, not customer logos. No partner or
 * customer relationship has been verified, so none is implied — the
 * component is laid out to accept approved logos later without a
 * redesign.
 */
export function CredibilityStrip() {
  return (
    <section
      aria-label="Workflow coverage"
      className="border-y border-line bg-surface"
    >
      <Container size="wide" className="py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
          <div className="flex items-center gap-3 lg:w-64 lg:shrink-0">
            <span className="text-eyebrow uppercase text-ink-4">
              Workflow coverage
            </span>
          </div>

          <ul className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {credibilityCategories.map((category) => (
              <li key={category.label} className="min-w-0">
                <p className="font-display text-[0.9375rem] font-medium tracking-[-0.01em] text-ink">
                  {category.label}
                </p>
                <p className="mt-0.5 text-caption text-ink-3">{category.detail}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 flex items-start gap-2 text-caption text-ink-4 lg:mt-5">
          <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Verified partner and customer logos will appear here once
            relationships are confirmed. Until then this strip states the
            workflow areas the platform covers.
          </span>
        </p>
      </Container>
    </section>
  );
}
