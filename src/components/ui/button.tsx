import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold tracking-wide transition-[transform,background-color,box-shadow,opacity] duration-150 ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-55 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-saffron text-paper shadow-[0_8px_18px_-10px_rgb(211_84_0_/_0.7)] hover:bg-saffron-deep active:scale-[0.98]",
        secondary:
          "bg-paper text-navy ring-1 ring-line hover:bg-cream active:scale-[0.98]",
        ghost: "bg-transparent text-maroon hover:bg-cream",
        navy: "bg-navy text-paper hover:bg-maroon-deep active:scale-[0.98]",
        danger: "bg-danger text-paper hover:bg-maroon-deep active:scale-[0.98]",
      },
      size: {
        md: "min-h-12 rounded-md px-5 text-base",
        lg: "min-h-14 rounded-lg px-6 text-lg",
        sm: "min-h-10 rounded-sm px-3 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
