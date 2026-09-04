import { useEffect } from "react";
import { pingVisit } from "@/lib/visits.functions";

const STORAGE_KEY = "tsf_vid";

function visitorToken(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const token = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, token);
    return token;
  } catch {
    return `tmp-${Math.random().toString(36).slice(2, 12)}`;
  }
}

export function VisitHeartbeat() {
  useEffect(() => {
    const token = visitorToken().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
    if (token.length < 8) return;

    void pingVisit({ data: { token, kind: "view" } }).catch(() => undefined);

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void pingVisit({ data: { token, kind: "beat" } }).catch(() => undefined);
    };
    const id = window.setInterval(tick, 60_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  return null;
}
