import type { ReactNode } from "react";
import { CAMP, PHOTOS } from "@/lib/camp";
import { PhotoSlot } from "@/components/photo-slot";
import { CalendarDays } from "lucide-react";

export function CampHeader() {
  return (
    <header className="relative overflow-hidden bg-cream text-ink">
      <div className="relative mx-auto max-w-5xl px-3 pb-5 pt-5 sm:px-6 sm:pb-8 sm:pt-7">
        <Flourish>
          <p className="font-display text-base font-semibold tracking-wide text-maroon sm:text-xl">
            {CAMP.inspiration}
          </p>
        </Flourish>

        <div className="inspiration-row mt-5 grid grid-cols-3 items-start justify-items-center gap-1.5 sm:gap-5">
          <PhotoSlot
            {...PHOTOS.jagatguru}
            tone="light"
            className="jagatguru-photo"
          />
          <PhotoSlot
            {...PHOTOS.modi}
            tone="light"
            className="narendra-modi-photo"
          />
          <PhotoSlot {...PHOTOS.yogi} tone="light" className="yogi-photo" />
        </div>

        <div className="gold-divider mt-6" aria-hidden="true" />

        <div className="mt-5 text-center">
          <h1 className="font-display text-xl leading-snug text-maroon sm:text-3xl">
            {CAMP.foundation}
          </h1>
          <p className="mt-1 text-sm font-semibold tracking-wide text-gold-deep">एवं</p>
          <p className="mt-1 font-display text-base leading-snug text-navy sm:text-xl">
            {CAMP.hospital}
          </p>
        </div>

        <div className="gold-divider mt-5" aria-hidden="true" />

        <div className="mt-5 text-center">
          <p className="banner-saffron mt-1 inline-block rounded-full px-4 py-1 text-xs font-semibold tracking-wide sm:text-sm">
            {CAMP.campaign}
          </p>
          <h2 className="mx-auto mt-3 max-w-xl font-display text-lg leading-snug text-maroon sm:mt-4 sm:text-3xl">
            {CAMP.title}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-navy/80 sm:text-base">
            {CAMP.subtitle}
          </p>
          <p className="banner-maroon mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:text-base">
            <CalendarDays className="size-4 shrink-0 text-gold" aria-hidden="true" />
            {CAMP.dateLine}
          </p>
        </div>
      </div>
    </header>
  );
}

function Flourish({ children }: { children: ReactNode }) {
  return (
    <div className="ornament">
      <span className="ornament-rule" aria-hidden="true" />
      <span className="ornament-diamond" aria-hidden="true" />
      {children}
      <span className="ornament-diamond" aria-hidden="true" />
      <span className="ornament-rule rotate-180" aria-hidden="true" />
    </div>
  );
}
