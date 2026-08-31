import { useState } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-16 sm:size-24",
  md: "size-20 sm:size-28",
  lg: "size-24 sm:size-36",
} as const;

export function PhotoSlot({
  src,
  name,
  title,
  size = "md",
  className,
}: {
  src: string;
  name: string;
  title: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className={cn("flex min-w-0 flex-col items-center text-center", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-full bg-cream shadow-[0_0_0_3px_var(--color-paper),0_0_0_6px_var(--color-gold)]",
          SIZES[size],
        )}
      >
        {failed ? (
          <div className="size-full bg-gradient-to-b from-gold/40 to-maroon/30" aria-hidden="true" />
        ) : (
          <img
            src={src}
            alt={name}
            className="size-full object-cover object-top"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <figcaption className="mt-2 min-w-0">
        <p className="text-xs font-semibold leading-tight text-paper sm:text-sm">{name}</p>
        <p className="mt-0.5 text-[0.65rem] leading-tight text-gold sm:text-xs">{title}</p>
      </figcaption>
    </figure>
  );
}
