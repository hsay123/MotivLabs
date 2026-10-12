import { hero } from "@/lib/content/landing";
import { media } from "@/lib/media/assets";
import { HeroMediaPlaceholder } from "@/components/media/HeroMediaPlaceholder";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ArrowRight, Check } from "@/components/ui/icons";

/**
 * Hero.
 *
 * On large screens the copy sits over the media slot as HTML — never
 * baked into the video — so the message survives a failed or blocked
 * media load. On small screens the copy stacks below the media, which is
 * more readable than shrinking overlay text.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24">
      {/* A single, restrained ambient wash behind the hero. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(101,71,228,0.10),transparent_70%)]"
      />

      <Container size="wide">
        <div className="relative">
          <HeroMediaPlaceholder asset={media.heroVideo} />

          <div className="mt-8 lg:absolute lg:inset-0 lg:mt-0 lg:flex lg:items-center lg:justify-center lg:px-10">
            <div className="rise mx-auto flex max-w-3xl flex-col items-center text-center">
              <p className="eyebrow justify-center text-night-ink-2 lg:text-night-ink-2">
                <span
                  aria-hidden
                  className="inline-block h-1 w-1 rounded-full bg-accent-400"
                />
                {hero.eyebrow}
              </p>

              <h1 className="mt-5 text-display-xl text-white lg:text-white">
                {hero.headline}
              </h1>

              <p className="mt-6 max-w-2xl text-body-lg text-ink-2 lg:text-night-ink-2">
                {hero.support}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <ButtonLink href={hero.primary.href} size="lg">
                  {hero.primary.label}
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
                <ButtonLink
                  href={hero.secondary.href}
                  variant="secondary"
                  size="lg"
                >
                  {hero.secondary.label}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>

        {/* Positioning points, not vanity metrics. */}
        <ul className="mt-10 grid gap-x-8 gap-y-4 border-t border-line pt-8 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
          {[
            "Rights-cleared video only",
            "Independent human review",
            "Versioned accepted records",
            "JSONL and CSV export",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2.5">
              <Check aria-hidden className="h-4 w-4 shrink-0 text-accent-600" />
              <span className="text-body-sm text-ink-2">{item}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
