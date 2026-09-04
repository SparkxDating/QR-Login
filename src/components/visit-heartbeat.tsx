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

function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function VisitHeartbeat() {
  useEffect(() => {
    const token = visitorToken().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
    if (token.length < 8) return;

    let lastViewDay = "";

    const send = (kind: "view" | "beat") => {
      void pingVisit({ data: { token, kind } }).catch(() => undefined);
      if (kind === "view") lastViewDay = todayIst();
    };

    send("view");

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      send(todayIst() !== lastViewDay ? "view" : "beat");
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
