import { CAMP } from "@/lib/camp";
import { Link } from "@tanstack/react-router";
import { MapPin, Phone } from "lucide-react";

export function CampFooter() {
  return (
    <footer className="mt-8 bg-navy text-paper">
      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
        <p className="text-center font-display text-lg leading-snug">
          {CAMP.foundation} एवं {CAMP.hospital}
        </p>
        <p className="mt-4 text-center text-sm font-semibold text-gold">{CAMP.freeNote}</p>
        <div className="mt-5 flex items-start justify-center gap-2 text-center text-sm text-paper/85">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
          <p>{CAMP.address}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
          <Phone className="size-4 text-gold" aria-hidden="true" />
          {CAMP.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:+91${phone}`}
              className="font-medium text-paper underline-offset-2 hover:underline"
            >
              {phone}
            </a>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-paper/45">
          <Link to="/admin" className="hover:text-gold">
            प्रशासन
          </Link>
        </p>
      </div>
    </footer>
  );
}
