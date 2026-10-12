import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "inverse"
  | "inverse-outline"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  // The single accent action. Used sparingly — one per view ideally.
  primary:
    "bg-accent-600 text-white hover:bg-accent-700 active:bg-accent-800 shadow-[0_1px_2px_rgba(22,19,14,0.16)]",
  // Neutral supporting action on light surfaces.
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-ink-4 hover:bg-surface-muted",
  ghost: "text-ink-2 hover:text-ink hover:bg-surface-muted",
  // On dark/night surfaces.
  inverse: "bg-white text-ink hover:bg-white/90",
  "inverse-outline":
    "border border-line-inverse text-night-ink hover:bg-white/10 hover:border-white/30",
  danger: "bg-danger-fg text-white hover:brightness-110",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-body-sm gap-1.5",
  md: "h-11 px-5 text-body-sm gap-2",
  lg: "h-12 px-6 text-body gap-2",
};

const baseClasses =
  "inline-flex select-none items-center justify-center rounded-md font-medium transition-colors duration-150 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50";

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps & {
  href: string;
  /** External links open in a new tab and get a rel guard. */
  external?: boolean;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;

export function ButtonLink({
  href,
  external,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer noopener" className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...rest}>
      {children}
    </Link>
  );
}
