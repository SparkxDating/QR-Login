import { CAMP, PHOTO_SLOTS } from "@/lib/camp";
import { PhotoSlot } from "@/components/photo-slot";
import { Eye } from "lucide-react";

function Emblem() {
  return (
    <div className="flex size-14 items-center justify-center rounded-full bg-paper text-saffron shadow-[0_0_0_3px_rgb(244_201_163_/_0.55)] sm:size-16">
      <Eye className="size-7 sm:size-8" strokeWidth={1.8} aria-hidden="true" />
    </div>
  );
}

export function CampHeader() {
  return (
    <header className="relative overflow-hidden bg-navy text-paper">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(1200px 280px at 50% -40%, rgb(211 84 0 / 0.45), transparent 60%), linear-gradient(180deg, var(--color-maroon) 0%, var(--color-navy) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 pb-7 pt-5 sm:px-6 sm:pb-8 sm:pt-6">
        <div className="mb-5 flex items-center justify-center gap-3 text-center">
          <Emblem />
          <div className="min-w-0">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-saffron-soft">
              {CAMP.hospitalEn}
            </p>
            <p className="text-[0.65rem] text-paper/70">{CAMP.hospitalUnit}</p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2">
          {PHOTO_SLOTS.map((slot) => (
            <PhotoSlot key={slot.src} {...slot} />
          ))}
        </div>

        <div className="mt-6 text-center">
          <h1 className="font-display text-2xl leading-snug text-paper sm:text-3xl">
            {CAMP.foundation}
          </h1>
          <p className="mt-1 text-sm text-saffron-soft">एवं</p>
          <p className="mt-1 font-display text-lg leading-snug text-paper sm:text-xl">
            {CAMP.hospital}
          </p>
        </div>
      </div>
    </header>
  );
}
