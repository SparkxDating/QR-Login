import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CAMP } from "@/lib/camp";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher, useDashboardI18n } from "@/components/dashboard-locale";
import {
  Activity,
  BarChart3,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
  Trash2,
  UserCog,
  Users,
  X,
} from "lucide-react";

export type AdminSection =
  | "overview"
  | "registrations"
  | "analytics"
  | "reports"
  | "settings"
  | "super";

const MAIN_NAV: { id: AdminSection; icon: typeof LayoutDashboard; labelKey: "nav.overview" | "nav.registrations" | "nav.analytics" | "nav.reports" | "nav.settings" }[] = [
  { id: "overview", labelKey: "nav.overview", icon: LayoutDashboard },
  { id: "registrations", labelKey: "nav.registrations", icon: Users },
  { id: "analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { id: "reports", labelKey: "nav.reports", icon: FileText },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

const SUPER_NAV: { id: string; icon: typeof UserCog; labelKey: "nav.saAccounts" | "nav.saSecurity" | "nav.saLogs" | "nav.saDelete" }[] = [
  { id: "sa-accounts", labelKey: "nav.saAccounts", icon: UserCog },
  { id: "sa-security", labelKey: "nav.saSecurity", icon: KeyRound },
  { id: "sa-logs", labelKey: "nav.saLogs", icon: Activity },
  { id: "sa-delete", labelKey: "nav.saDelete", icon: Trash2 },
];

export function AdminShell({
  isSuperAdmin,
  section,
  onSection,
  menuOpen,
  onMenu,
  onExport,
  onLogout,
  children,
}: {
  isSuperAdmin: boolean;
  section: AdminSection;
  onSection: (next: AdminSection, anchor?: string) => void;
  menuOpen: boolean;
  onMenu: (open: boolean) => void;
  onExport: () => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  const { t } = useDashboardI18n();
  const roleBadge = isSuperAdmin ? t("role.badgeSuper") : t("role.badgeAdmin");

  return (
    <div className="min-h-dvh bg-cream text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className={`h-1 ${isSuperAdmin ? "bg-maroon" : "bg-saffron"}`} aria-hidden="true" />
        <div className="flex items-center gap-2 px-3 py-2.5 sm:gap-3 lg:px-5">
          <button
            type="button"
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-navy hover:bg-cream lg:hidden"
            onClick={() => onMenu(!menuOpen)}
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <img
            src={CAMP.logo.src}
            alt={CAMP.logo.alt}
            className="size-11 shrink-0 rounded-md object-cover ring-1 ring-line"
            width={44}
            height={44}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-sm leading-tight text-maroon sm:text-base">
                {CAMP.foundation}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide sm:hidden ${
                  isSuperAdmin ? "bg-maroon text-paper" : "bg-navy text-paper"
                }`}
              >
                {roleBadge}
              </span>
            </div>
            <p className="truncate text-xs text-muted">{CAMP.title}</p>
          </div>
          <span
            className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide sm:inline-flex ${
              isSuperAdmin ? "bg-maroon text-paper" : "bg-navy text-paper"
            }`}
          >
            {roleBadge}
          </span>
          <LanguageSwitcher />
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/register"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-saffron px-3 text-sm font-semibold text-paper hover:bg-saffron-deep"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("nav.newRegistration")}
            </Link>
            <Button variant="secondary" size="sm" onClick={onExport}>
              CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              {t("nav.logout")}
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2 md:hidden">
          <Link
            to="/register"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md bg-saffron px-3 text-sm font-semibold text-paper"
          >
            <Plus className="size-4" />
            {t("nav.newRegistration")}
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center rounded-md bg-paper px-3 text-sm font-semibold text-navy ring-1 ring-line"
            onClick={onExport}
          >
            CSV
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md px-3 text-sm font-semibold text-maroon"
            onClick={onLogout}
          >
            <LogOut className="size-4" />
            {t("nav.logout")}
          </button>
        </div>
      </header>

      <div className="lg:flex lg:min-h-[calc(100dvh-4.5rem)]">
        {menuOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-navy/40 lg:hidden"
            aria-label={t("nav.closeMenu")}
            onClick={() => onMenu(false)}
          />
        ) : null}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 overflow-y-auto border-r border-line bg-paper px-3 py-4 pt-24 transition-transform duration-200 ease-[var(--ease-out)] lg:sticky lg:top-[4.5rem] lg:z-0 lg:block lg:h-[calc(100dvh-4.5rem)] lg:w-60 lg:shrink-0 lg:pt-5 ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <p className="px-2 text-xs font-semibold tracking-wide text-muted">{t("nav.navigation")}</p>
          <nav className="mt-2 grid gap-1" aria-label={t("nav.dashboard")}>
            {MAIN_NAV.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2.5 rounded-md px-3 text-left text-sm font-medium ${
                    active ? "bg-maroon text-paper" : "text-navy hover:bg-cream"
                  }`}
                  onClick={() => onSection(item.id)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {t(item.labelKey)}
                </button>
              );
            })}
          </nav>
          {isSuperAdmin ? (
            <div className="mt-6 overflow-hidden rounded-lg bg-maroon/10 ring-1 ring-maroon/20">
              <p className="flex items-center gap-1.5 bg-maroon px-3 py-2 text-xs font-semibold tracking-wide text-paper">
                <Shield className="size-3.5" aria-hidden="true" />
                {t("role.badgeSuper")}
              </p>
              <nav className="grid gap-1 p-2" aria-label={t("nav.superAdminAria")}>
                <button
                  type="button"
                  aria-current={section === "super" ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-left text-sm font-medium ${
                    section === "super" ? "bg-maroon text-paper" : "text-navy hover:bg-paper"
                  }`}
                  onClick={() => onSection("super")}
                >
                  <Shield className="size-4 shrink-0" aria-hidden="true" />
                  {t("nav.superAdmin")}
                </button>
                {SUPER_NAV.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="flex min-h-11 items-center gap-2 rounded-md px-3 pl-4 text-left text-sm text-muted hover:bg-paper hover:text-navy"
                      onClick={() => onSection("super", item.id)}
                    >
                      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                      {t(item.labelKey)}
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function SectionTitle({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker ? (
          <p className="text-xs font-semibold tracking-wide text-saffron">{kicker}</p>
        ) : null}
        <h1 className="font-display text-2xl leading-tight text-navy sm:text-3xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}
