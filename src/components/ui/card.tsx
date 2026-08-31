import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl bg-paper p-5 shadow-[var(--shadow-card)] sm:p-6",
        className,
      )}
      {...props}
    />
  );
}
