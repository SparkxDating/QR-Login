import { CAMP, CONTACTS } from "@/lib/camp";
import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";

export function CampFooter() {
  return (
    <footer className="bg-cream text-maroon">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <p className="text-center font-display text-base leading-snug sm:text-lg">
          {CAMP.foundation} एवं {CAMP.hospital}
        </p>

        <section className="mt-6 overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-card)]">
          <h2 className="banner-saffron px-3 py-2.5 text-center font-display text-sm leading-snug sm:px-5 sm:text-lg">
            {CAMP.contactHeading}
          </h2>
          <ul className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-5">
            {CONTACTS.map((person) => (
              <li
                key={person.phone}
                className="rounded-lg bg-cream px-3 py-3 text-center"
              >
                <p className="text-sm font-semibold leading-snug text-maroon">
                  {person.name}
                </p>
                <a
                  href={`tel:+91${person.phone}`}
                  className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-navy px-2 text-base font-bold tracking-wide text-paper tabular-nums"
                >
                  <Phone className="size-4 shrink-0 text-gold" aria-hidden="true" />
                  {person.phone}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-6 text-center text-xs text-muted">
          <Link to="/admin" className="hover:text-maroon">
            प्रशासन
          </Link>
        </p>
      </div>
      <p className="banner-maroon px-4 py-3 text-center font-display text-base font-semibold sm:text-xl">
        {CAMP.freeNote}
      </p>
    </footer>
  );
}
