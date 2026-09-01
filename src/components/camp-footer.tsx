import { CAMP } from "@/lib/camp";
import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";

export function CampFooter() {
  return (
    <footer className="bg-cream text-maroon">
      <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        <p className="text-center font-display text-base leading-snug sm:text-lg">
          {CAMP.foundation} एवं {CAMP.hospital}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-navy">
          <Phone className="size-4 text-gold" aria-hidden="true" />
          {CAMP.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:+91${phone}`}
              className="font-medium underline-offset-2 hover:underline"
            >
              {phone}
            </a>
          ))}
        </div>
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
