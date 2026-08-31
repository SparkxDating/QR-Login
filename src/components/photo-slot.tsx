import { useState } from "react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-20 sm:size-24",
  md: "size-24 sm:size-32",
  lg: "size-28 sm:size-40",
  xl: "size-36 sm:size-52",
} as const;

export function PhotoSlot({
  src,
  name,
  title,
  size = "md",
  tone = "light",
  shape = "circle",
  objectPosition = "center top",
  showCaption = true,
  className,
}: {
  src: string;
  name: string;
  title?: string;
  size?: keyof typeof SIZES;
  tone?: "light" | "dark";
  shape?: "circle" | "rounded";
  objectPosition?: string;
  showCaption?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const dark = tone === "dark";

  return (
    <figure className={cn("flex min-w-0 flex-col items-center text-center", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-cream shadow-[0_0_0_3px_var(--color-cream),0_0_0_7px_var(--color-gold)]",
          shape === "circle" ? "rounded-full" : "rounded-xl",
          shape === "rounded" ? "h-44 w-36 sm:h-56 sm:w-44" : SIZES[size],
        )}
      >
        {failed ? (
          <div
            className="size-full"
            style={{
              background:
                "linear-gradient(180deg, rgb(196 163 90 / 0.4), rgb(122 31 26 / 0.3))",
            }}
            aria-hidden="true"
          />
        ) : (
          <img
            src={src}
            alt={name}
            className="size-full object-cover"
            style={{ objectPosition }}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      {showCaption ? (
        <figcaption className="mt-2 min-w-0 max-w-44 sm:max-w-52">
          <p
            className={cn(
              "text-xs font-semibold leading-tight sm:text-sm",
              dark ? "text-paper" : "text-maroon",
            )}
          >
            {name}
          </p>
          {title ? (
            <p
              className={cn(
                "mt-0.5 text-xs leading-snug",
                dark ? "text-gold" : "text-navy/75",
              )}
            >
              {title}
            </p>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
