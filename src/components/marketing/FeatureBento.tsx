"use client";

/**
 * Feature Bento Box — Encord Style.
 *
 * Full-width bento card with embedded video on left, text and CTA on right.
 * Responsive: 2-column grid on desktop, stacked on mobile.
 * Large top padding ensures section starts below the fold.
 */
export function FeatureBento() {
  return (
    <section className="bg-white pt-24 lg:pt-32 pb-16 lg:pb-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-10">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16 lg:mb-20">
          <h2 className="font-display text-display-lg text-[#000000] font-bold tracking-[-0.04em] leading-[1.0]">
            Manage, curate, and annotate AI data
          </h2>
          <p className="mt-4 text-body-lg text-[#555555] leading-relaxed max-w-2xl mx-auto">
            With customizable multimodal workflows and native agent integrations.
          </p>
        </div>

        {/* Bento Box Card */}
        <div className="bento-card flex flex-col lg:flex-row gap-10 lg:gap-12 items-center p-8 lg:p-12">
          {/* Left Column: Video */}
          <div className="w-full lg:w-[60%] flex-shrink-0">
            <div className="relative aspect-video rounded-xl overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                aria-label="Annotation and labeling workflow demo"
              >
                <source src="/Organ.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          {/* Right Column: Text & CTA */}
          <div className="w-full lg:w-[40%] flex flex-col justify-center">
            <h3 className="font-display text-3xl lg:text-4xl font-bold text-[#000000] tracking-[-0.02em] leading-[1.1] mb-6">
              Label and annotate
            </h3>
            <p className="text-[#4A4A4A] text-body-lg leading-relaxed mb-8">
              Native video annotation, LiDAR, audio, text, and sensor fusion in the same workflow. Label lineage and quality controls built in for production scale.
            </p>
            <a
              href="/explore"
              className="inline-flex items-center justify-center gap-2 w-fit px-6 py-3 bg-white text-[#000000] border border-[#E0E0E0] rounded-md font-semibold text-body transition-all duration-200 hover:border-[#CCCCCC] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
            >
              Explore annotation & labeling
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4-4 4" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}