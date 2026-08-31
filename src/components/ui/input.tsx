import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-md bg-paper px-3.5 text-base text-ink shadow-[inset_0_0_0_1px_var(--color-line)] placeholder:text-muted/80",
        "transition-[box-shadow] duration-150",
        "focus:shadow-[inset_0_0_0_2px_var(--color-saffron)] focus:outline-none",
        "disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md bg-paper px-3.5 py-3 text-base text-ink shadow-[inset_0_0_0_1px_var(--color-line)] placeholder:text-muted/80",
        "transition-[box-shadow] duration-150",
        "focus:shadow-[inset_0_0_0_2px_var(--color-saffron)] focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function NativeSelect({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "min-h-12 w-full appearance-none rounded-md bg-paper bg-[length:1rem] bg-[right_0.85rem_center] bg-no-repeat px-3.5 pr-10 text-base text-ink shadow-[inset_0_0_0_1px_var(--color-line)]",
        "focus:shadow-[inset_0_0_0_2px_var(--color-saffron)] focus:outline-none",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B1D1D' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
      }}
      {...props}
    >
      {children}
    </select>
  );
}
