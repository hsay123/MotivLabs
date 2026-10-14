"use client";

import { Container } from "@/components/ui/Container";

/**
 * Logo Marquee — Encord Style.
 *
 * Infinite scrolling customer logo strip using hardware-accelerated CSS animation.
 * Logos are displayed in grayscale with uniform height for a clean, monochrome strip.
 */
export function LogoMarquee() {
  const logos = [
    { name: "Standard AI" },
    { name: "Archetype" },
    { name: "Agility" },
    { name: "Forterra" },
    { name: "Hitachi" },
    { name: "UiPath" },
    { name: "Neura" },
  ];

  // Duplicate the logos for seamless infinite loop
  const duplicatedLogos = [...logos, ...logos];

  return (
    <section className="bg-white py-12 lg:py-16" aria-label="Customer logos">
      <Container size="wide" className="px-5 sm:px-8 lg:px-10">
        <div className="overflow-hidden">
          <div className="flex items-center gap-10 lg:gap-16 whitespace-nowrap animate-marquee">
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex-shrink-0 flex items-center logo-marquee-item"
              >
                <span className="font-display text-[1.125rem] lg:text-[1.25rem] font-medium tracking-[-0.01em] text-[#000000] leading-tight whitespace-nowrap px-4">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}