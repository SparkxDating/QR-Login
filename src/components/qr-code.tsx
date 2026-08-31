import { useMemo } from "react";
import { encode } from "uqr";

export function QrCode({
  value,
  label,
  size = 196,
  id,
}: {
  value: string;
  label?: string;
  size?: number;
  id?: string;
}) {
  const { size: modules, path } = useMemo(() => {
    const qr = encode(value, { ecc: "M", border: 2 });
    const parts: string[] = [];
    for (let y = 0; y < qr.size; y += 1) {
      for (let x = 0; x < qr.size; x += 1) {
        if (qr.data[y]?.[x]) parts.push(`M${x} ${y}h1v1h-1z`);
      }
    }
    return { size: qr.size, path: parts.join("") };
  }, [value]);

  return (
    <figure className="flex flex-col items-center">
      <svg
        id={id}
        width={size}
        height={size}
        viewBox={`0 0 ${modules} ${modules}`}
        role="img"
        aria-label={label ?? "QR कोड"}
        className="rounded-md bg-paper p-1 shadow-[var(--shadow-card)]"
      >
        <rect width={modules} height={modules} fill="#fffdf9" />
        <path d={path} fill="#1b2a4a" />
      </svg>
    </figure>
  );
}
