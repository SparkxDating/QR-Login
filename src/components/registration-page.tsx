import { CAMP, DOCUMENTS, SERVICES } from "@/lib/camp";
import { CampHeader } from "@/components/camp-header";
import { CampFooter } from "@/components/camp-footer";
import { RegistrationForm } from "@/components/registration-form";
import { CalendarDays, Check, Clock } from "lucide-react";

export function RegistrationPage() {
  return (
    <div className="min-h-dvh bg-cream">
      <div className="bg-saffron px-4 py-2 text-center text-sm font-semibold text-paper">
        निःशुल्क मोतियाबिंद शिविर · {CAMP.dateLine}
      </div>
      <CampHeader />

      <main className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="text-center">
          <h2 className="font-display text-[1.65rem] leading-snug text-maroon sm:text-4xl">
            {CAMP.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl rounded-md bg-navy px-3 py-2 text-sm leading-relaxed text-paper">
            {CAMP.subtitle}
          </p>
          <p className="mt-4 font-display text-xl text-saffron sm:text-2xl">{CAMP.dateLine}</p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <InfoChip icon={CalendarDays} label="कार्यक्रम तिथि" value={`${CAMP.dateLabel}, ${CAMP.dayLabel}`} />
          <InfoChip icon={Clock} label="समय" value={CAMP.timeLabel} />
        </div>

        <section className="mt-5 rounded-xl bg-paper p-4 shadow-[var(--shadow-card)] sm:p-5">
          <h3 className="text-center font-display text-xl text-navy">निःशुल्क सेवाएँ</h3>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <li
                key={service.title}
                className="flex items-center gap-3 rounded-lg bg-cream px-3 py-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-paper">
                  <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-maroon">{service.title}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6">
          <RegistrationForm />
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
