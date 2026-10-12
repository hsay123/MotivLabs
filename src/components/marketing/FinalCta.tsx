import { finalCta } from "@/lib/content/landing";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRight } from "@/components/ui/icons";

/**
 * Closing call to action.
 *
 * A single dark band with one primary action. The night surface here is
 * the page's last tonal shift, so it reads as a deliberate close rather
 * than another equal-weight section.
 */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-night text-night-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_-10%,rgba(101,71,228,0.32),transparent_62%)]"
      />
      <div aria-hidden className="bg-grid-dark absolute inset-0 opacity-40" />

      <Container size="default" className="relative py-20 sm:py-28 lg:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-display-lg text-white">{finalCta.heading}</h2>
          <p className="mt-6 max-w-xl text-body-lg text-night-ink-2">
            {finalCta.support}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={finalCta.primary.href} variant="inverse" size="lg">
              {finalCta.primary.label}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink
              href={finalCta.secondary.href}
              variant="inverse-outline"
              size="lg"
            >
              {finalCta.secondary.label}
            </ButtonLink>
          </div>

          <p className="mt-6 text-caption text-night-ink-3">
            Pilots run against your rights-cleared data. No account is created
            until a scope is agreed.
          </p>
        </div>
      </Container>
    </section>
  );
}
