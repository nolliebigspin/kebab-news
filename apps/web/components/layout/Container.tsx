import type { ComponentPropsWithoutRef, ElementType } from "react";
import { cn } from "@/lib/utils";

const WIDTHS = {
  /** Reading measure for prose pages (< 80 characters per line). */
  prose: "max-w-3xl",
  /** Article page: prose column plus sidebar. */
  content: "max-w-5xl",
  /** Lists and the homepage. */
  wide: "max-w-6xl",
} as const;

type ContainerProps<T extends ElementType> = {
  as?: T;
  width?: keyof typeof WIDTHS;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

/** The one page gutter: 16px on phones, 24px from `sm`. */
export function Container<T extends ElementType = "div">({
  as,
  width = "wide",
  className,
  ...props
}: ContainerProps<T>) {
  const Component = as ?? "div";
  return (
    <Component className={cn("mx-auto w-full px-4 sm:px-6", WIDTHS[width], className)} {...props} />
  );
}
