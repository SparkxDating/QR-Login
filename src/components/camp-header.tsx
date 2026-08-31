import { CAMP, PHOTOS } from "@/lib/camp";
import { PhotoSlot } from "@/components/photo-slot";

export function CampHeader() {
  return (
    <header className="relative overflow-hidden bg-navy text-paper">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 240px at 50% -30%, rgb(196 163 90 / 0.22), transparent 55%), linear-gradient(180deg, var(--color-maroon) 0%, var(--color-navy) 100%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-4 pb-4 pt-3 sm:px-6 sm:pb-8 sm:pt-5">
        <div className="grid grid-cols-[auto_1fr] items-start gap-3">
          <PhotoSlot {...PHOTOS.yogi} size="sm" />
          <div className="min-w-0 pt-0.5 text-right">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-gold">
              {CAMP.hospitalEn}
            </p>
            <p className="text-[0.62rem] text-paper/70">{CAMP.hospitalUnit}</p>
            <p className="mt-2 inline-block rounded-full bg-saffron px-3 py-1 text-xs font-semibold text-paper">
              {CAMP.campaign}
            </p>
            <p className="mt-1.5 font-display text-base font-semibold text-gold sm:text-lg">
              {CAMP.dateLine}
            </p>
          </div>
        </div>

        <div className="mt-2 flex justify-center">
          <PhotoSlot {...PHOTOS.modi} size="lg" />
        </div>

        <div className="mt-3 text-center">
          <h1 className="font-display text-xl leading-snug text-paper sm:text-3xl">
            {CAMP.foundation}
          </h1>
          <p className="mt-0.5 text-sm text-gold">एवं</p>
          <p className="mt-0.5 font-display text-base leading-snug text-paper sm:text-xl">
            {CAMP.hospital}
          </p>
        </div>

        <div className="mt-2 flex justify-end">
          <PhotoSlot {...PHOTOS.bhola} size="sm" />
        </div>
      </div>
    </header>
  );
}
