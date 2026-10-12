import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Temporary brand mark.
 *
 * The final logo has not been supplied, so this is an intentional
 * text-based wordmark with a simple geometric glyph. Replace
 * `WordmarkGlyph` and the wordmark styling when the real logo lands —
 * nothing else depends on its internals.
 */
export function WordmarkGlyph({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex h-7 w-7 items-center justify-center rounded-[9px]",
        tone === "dark" ? "bg-white" : "bg-accent-600",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
        <path
          d="M4 17.5 10 7l4 6.5L20 6"
          stroke={tone === "dark" ? "#6547e4" : "#ffffff"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="6" r="2" fill={tone === "dark" ? "#6547e4" : "#ffffff"} />
      </svg>
    </span>
  );
}

export function Wordmark({
  tone = "light",
  className,
  href = "/",
}: {
  tone?: "light" | "dark";
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="Motive Labs — home"
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-md focus-visible:outline-none",
        className,
      )}
    >
      <WordmarkGlyph tone={tone} />
      <span
        className={cn(
          "font-display text-[1.0625rem] font-medium tracking-[-0.02em]",
          tone === "dark" ? "text-white" : "text-ink",
        )}
      >
        Motive&nbsp;Labs
      </span>
    </Link>
  );
}
