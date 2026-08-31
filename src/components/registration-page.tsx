import { CAMP, DOCUMENTS, SERVICES } from "@/lib/camp";
import { CampHeader } from "@/components/camp-header";
import { CampFooter } from "@/components/camp-footer";
import { RegistrationForm } from "@/components/registration-form";
import { CalendarDays, Clock, Glasses, Stethoscope, Syringe } from "lucide-react";

const SERVICE_ICONS = [Stethoscope, Syringe, Glasses] as const;

export function RegistrationPage() {
  return (
    <div className="min-h-dvh bg-cream">
      <CampHeader />

      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="text-center">
          <span className="inline-block rounded-full bg-maroon px-4 py-1 text-sm font-semibold text-paper">
            {CAMP.campaign}
          </span>
          <h2 className="mt-4 font-display text-[1.7rem] leading-snug text-maroon sm:text-4xl">
            {CAMP.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl rounded-md bg-navy px-3 py-2 text-sm leading-relaxed text-paper">
            {CAMP.subtitle}
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <InfoChip icon={CalendarDays} label="\u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0924\u093f\u0925\u093f" value={`${CAMP.dateLabel}, ${CAMP.dayLabel}`} />
          <InfoChip icon={Clock} label="\u0938\u092e\u092f" value={CAMP.timeLabel} />
        </div>

        <section className="mt-5 rounded-xl bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
          <h3 className="text-center font-display text-xl text-navy">\u0939\u092e\u093e\u0930\u0940 \u0938\u0947\u0935\u093e\u090f\u0901</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {SERVICES.map((service, i) => {
              const Icon = SERVICE_ICONS[i] ?? Stethoscope;
              return (
                <li
                  key={service.title}
                  className="rounded-lg bg-cream px-3 py-4 text-center"
                >
                  <Icon className="mx-auto size-6 text-saffron" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-maroon">{service.title}</p>
                  <p className="mt-1 text-xs text-muted">{service.detail}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-5 rounded-xl bg-paper px-4 py-4 shadow-[var(--shadow-card)] sm:px-5">
          <h3 className="font-display text-lg text-navy">\u0906\u0935\u0936\u094d\u092f\u0915 \u0926\u0938\u094d\u0924\u093e\u0935\u0947\u091c \u090f\u0935\u0902 \u0938\u093e\u092e\u0917\u094d\u0930\u0940</h3>
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

        <div className="mt-6">
          <RegistrationForm />
        </div>
      </main>

      <CampFooter />
    </div>
  );
}

function InfoChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-paper px-3 py-3 shadow-[var(--shadow-card)]">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-saffron/12 text-saffron">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="text-sm font-semibold text-navy">{value}</p>
      </div>
    </div>
  );
}
