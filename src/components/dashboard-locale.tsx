import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  DASHBOARD_DEFAULT_LANG,
  DASHBOARD_LANG_KEY,
  dashboardLocale,
  isDashboardLang,
  translate,
  type DashboardLang,
  type Translate,
} from "@/lib/dashboard-i18n";

type DashboardI18n = {
  lang: DashboardLang;
  setLang: (lang: DashboardLang) => void;
  t: Translate;
  locale: string;
};

const DashboardI18nContext = createContext<DashboardI18n | null>(null);

function readStoredLang(): DashboardLang {
  if (typeof window === "undefined") return DASHBOARD_DEFAULT_LANG;
  try {
    const stored = window.localStorage.getItem(DASHBOARD_LANG_KEY);
    return isDashboardLang(stored) ? stored : DASHBOARD_DEFAULT_LANG;
  } catch {
    return DASHBOARD_DEFAULT_LANG;
  }
}

export function DashboardLocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<DashboardLang>(readStoredLang);

  const setLang = useCallback((next: DashboardLang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(DASHBOARD_LANG_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo<DashboardI18n>(
    () => ({ lang, setLang, t, locale: dashboardLocale(lang) }),
    [lang, setLang, t],
  );

  return <DashboardI18nContext.Provider value={value}>{children}</DashboardI18nContext.Provider>;
}

export function useDashboardI18n(): DashboardI18n {
  const ctx = useContext(DashboardI18nContext);
  if (!ctx) {
    throw new Error("useDashboardI18n must be used within DashboardLocaleProvider");
  }
  return ctx;
}

export function LanguageSwitcher() {
  const { lang, setLang, t } = useDashboardI18n();
  const btn = (id: DashboardLang, label: string) => (
    <button
      type="button"
      className={`min-h-9 rounded-full px-2.5 text-xs font-semibold sm:min-h-10 sm:px-3 ${
        lang === id ? "bg-maroon text-paper shadow-sm" : "text-navy hover:bg-paper"
      }`}
      aria-pressed={lang === id}
      onClick={() => setLang(id)}
    >
      {label}
    </button>
  );

  return (
    <div
      className="inline-flex shrink-0 items-center rounded-full bg-cream p-0.5 ring-1 ring-line"
      role="group"
      aria-label={t("lang.label")}
    >
      {btn("hi", `🇮🇳 ${t("lang.hi")}`)}
      {btn("en", t("lang.en"))}
    </div>
  );
}

export function tStatus(t: Translate, value: string): string {
  switch (value) {
    case "registered":
      return t("status.registered");
    case "screened":
      return t("status.screened");
    case "operation_recommended":
      return t("status.operation_recommended");
    case "operation_scheduled":
      return t("status.operation_scheduled");
    case "operation_completed":
      return t("status.operation_completed");
    case "follow_up":
      return t("status.follow_up");
    case "no_show":
      return t("status.no_show");
    case "ineligible":
      return t("status.ineligible");
    case "cancelled":
      return t("status.cancelled");
    default:
      return value;
  }
}

export function tFollowUp(t: Translate, value: string): string {
  switch (value) {
    case "scheduled":
      return t("followUp.scheduled");
    case "done":
      return t("followUp.done");
    case "missed":
      return t("followUp.missed");
    case "postponed":
      return t("followUp.postponed");
    default:
      return value || "—";
  }
}

export function tDuplicate(t: Translate, kind: "" | "mobile" | "name_village" | "both"): string {
  if (kind === "both") return t("duplicate.both");
  if (kind === "mobile") return t("duplicate.mobile");
  if (kind === "name_village") return t("duplicate.nameVillage");
  return "";
}

export function tAudit(t: Translate, action: string): string {
  switch (action) {
    case "login_success":
      return t("audit.login_success");
    case "login_fail":
      return t("audit.login_fail");
    case "password_change":
      return t("audit.password_change");
    case "password_recover":
      return t("audit.password_recover");
    case "password_reset":
      return t("audit.password_reset");
    case "registration_delete":
      return t("audit.registration_delete");
    case "logout_all":
      return t("audit.logout_all");
    default:
      return action;
  }
}

export function tRole(t: Translate, role: string): string {
  if (role === "super_admin") return t("role.superAdmin");
  if (role === "admin") return t("role.admin");
  return role;
}
