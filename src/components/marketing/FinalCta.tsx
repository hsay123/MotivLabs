import { finalCta } from "@/lib/content/landing";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * Closing call to action — Encord Style.
 *
 * Pure white background with Lime Green primary CTA.
 */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-white">
      <Container size="default" className="relative py-20 sm:py-28 lg:py-32">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-display-lg text-[#000000]">{finalCta.heading}</h2>
          <p className="mt-6 max-w-xl text-body-lg text-[#333333]">
            {finalCta.support}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href={finalCta.primary.href} variant="primary" size="lg">
              {finalCta.primary.label}
              <svg className="h-5 w-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4-4 4" />
              </svg>
            </ButtonLink>
            <ButtonLink
              href={finalCta.secondary.href}
              variant="secondary"
              size="lg"
            >
              {finalCta.secondary.label}
            </ButtonLink>
          </div>

          <p className="mt-6 text-caption text-[#666666]">
            Pilots run against your rights-cleared data. No account is created
            until a scope is agreed.
          </p>
        </div>
      </Container>
    </section>
  );
}