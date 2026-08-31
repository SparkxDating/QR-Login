import type { ReactNode } from "react";
import { CAMP, DOCUMENTS, PHOTOS, SERVICES } from "@/lib/camp";
import { CampHeader } from "@/components/camp-header";
import { CampFooter } from "@/components/camp-footer";
import { RegistrationForm } from "@/components/registration-form";
import { PhotoSlot } from "@/components/photo-slot";
import { cn } from "@/lib/utils";
import { BedDouble, Eye, Pill } from "lucide-react";

const SERVICE_ICONS = {
  eye: Eye,
  bed: BedDouble,
  pill: Pill,
} as const;

export function RegistrationPage() {
  return (
    <div className="poster-shell min-h-dvh">
      <CampHeader />

      <main className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-7">
        <section className="overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-card)]">
          <h3 className="banner-saffron px-4 py-2.5 text-center font-display text-lg sm:text-xl">
            {CAMP.servicesHeading}
          </h3>
          <ul className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            {SERVICES.map((service) => {
              const Icon = SERVICE_ICONS[service.icon];
              return (
                <li
                  key={service.title}
                  className="flex items-center gap-3 rounded-lg bg-cream px-3 py-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-saffron text-paper">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold text-maroon">{service.title}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
          <OrganizerCard className="lg:hidden" compact />
          <RegistrationForm />
          <OrganizerCard className="hidden lg:block" />
        </div>

        <section className="mt-5 rounded-xl bg-paper px-4 py-4 shadow-[var(--shadow-card)] sm:px-5">
          <h3 className="font-display text-lg text-navy">आवश्यक दस्तावेज एवं सामग्री</h3>
          <ol className="mt-3 grid gap-2 text-sm text-ink">
            {DOCUMENTS.map((doc, i) => (
              <li key={doc} className="flex gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-saffron text-xs font-semibold text-paper">
                  {i + 1}
                </span>
                <span className="pt-0.5">{doc}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-sm font-medium text-success">{CAMP.operationNote}</p>
        </section>
      </main>

      <YogiInspiration />
      <CampFooter />
    </div>
  );
}

function OrganizerCard({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "overflow-hidden rounded-xl bg-maroon text-center text-paper shadow-[var(--shadow-card)]",
        compact ? "flex items-center gap-4 p-3 text-left" : "px-4 py-5",
        className,
      )}
    >
      <PhotoSlot
        {...PHOTOS.bhola}
        shape={compact ? "circle" : "rounded"}
        size="md"
        tone="dark"
        objectPosition="center 18%"
        showCaption={false}
        className={compact ? "shrink-0" : undefined}
      />
      <div className={compact ? "min-w-0" : "mt-4"}>
        <p className="text-xs font-semibold tracking-wide text-gold sm:text-sm">
          {CAMP.organizerRole}
        </p>
        <p className="mt-1 font-display text-lg leading-snug sm:text-xl">{CAMP.organizer}</p>
        <p className="mt-2 text-xs leading-snug text-paper/85 sm:text-sm">{CAMP.organizerBoard}</p>
        <p className="mt-1 text-xs font-semibold text-gold sm:text-sm">{CAMP.organizerGov}</p>
      </div>
    </aside>
  );
}

function YogiInspiration() {
  return (
    <section className="banner-saffron mt-4">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <FlourishLight>
          <p className="font-display text-lg tracking-wide text-paper sm:text-xl">
            {CAMP.inspiration}
          </p>
        </FlourishLight>
        <div className="mt-5 flex flex-col items-center">
          <PhotoSlot
            {...PHOTOS.yogi}
            size="xl"
            tone="dark"
            objectPosition="center 20%"
            showCaption={false}
          />
          <p className="mt-4 text-center font-display text-xl leading-snug text-paper sm:text-3xl">
            {CAMP.yogiHonorific}
          </p>
        </div>
      </div>
    </section>
  );
}

function FlourishLight({ children }: { children: ReactNode }) {
  return (
    <div className="ornament">
      <span className="ornament-rule" aria-hidden="true" />
      <span className="ornament-diamond bg-paper" aria-hidden="true" />
      {children}
      <span className="ornament-diamond bg-paper" aria-hidden="true" />
      <span className="ornament-rule rotate-180" aria-hidden="true" />
    </div>
  );
}
