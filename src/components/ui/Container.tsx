import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ContainerProps<T extends ElementType> = {
  as?: T;
  /** `default` = 1280px content column; `wide` = 1440px; `prose` = readable measure. */
  size?: "default" | "wide" | "prose" | "full";
  className?: string;
} & Omit<HTMLAttributes<HTMLElement>, "className">;

const sizes = {
  default: "max-w-container",
  wide: "max-w-container-wide",
  prose: "max-w-3xl",
  full: "max-w-none",
} as const;

/**
 * The single content container used across the site.
 * 1280px max width with 20→40px gutters, matching the reference rhythm.
 */
export function Container<T extends ElementType = "div">({
  as,
  size = "default",
  className,
  ...rest
}: ContainerProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn("mx-auto w-full px-5 sm:px-8 lg:px-10", sizes[size], className)}
      {...rest}
    />
  );
}
