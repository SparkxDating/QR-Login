import { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CAMP } from "@/lib/camp";
import { Button } from "@/components/ui/button";
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

const MAIN_NAV: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "अवलोकन", icon: LayoutDashboard },
  { id: "registrations", label: "पंजीकरण", icon: Users },
  { id: "analytics", label: "आँकड़े", icon: BarChart3 },
  { id: "reports", label: "रिपोर्ट", icon: FileText },
  { id: "settings", label: "सेटिंग", icon: Settings },
];

const SUPER_NAV: { id: string; label: string; icon: typeof UserCog }[] = [
  { id: "sa-accounts", label: "Admin Accounts", icon: UserCog },
  { id: "sa-security", label: "Security", icon: KeyRound },
  { id: "sa-logs", label: "Activity Logs", icon: Activity },
  { id: "sa-delete", label: "Delete Management", icon: Trash2 },
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
  return (
    <div className="min-h-dvh bg-cream text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur-sm">
        <div className="h-0.5 bg-saffron" aria-hidden="true" />
        <div className="flex items-center gap-3 px-3 py-2.5 lg:px-5">
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-md text-navy hover:bg-cream lg:hidden"
            onClick={() => onMenu(!menuOpen)}
            aria-label={menuOpen ? "मेनू बंद करें" : "मेनू खोलें"}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <img
            src={CAMP.logo.src}
            alt={CAMP.logo.alt}
            className="size-11 rounded-md object-cover ring-1 ring-line"
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
                {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
              </span>
            </div>
            <p className="truncate text-xs text-muted">{CAMP.title}</p>
          </div>
          <span
            className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide sm:inline-flex ${
              isSuperAdmin ? "bg-maroon text-paper" : "bg-navy text-paper"
            }`}
          >
            {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
          </span>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              to="/register"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-saffron px-3 text-sm font-semibold text-paper hover:bg-saffron-deep"
            >
              <Plus className="size-4" aria-hidden="true" />
              नया पंजीकरण
            </Link>
            <Button variant="secondary" size="sm" onClick={onExport}>
              CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="size-4" aria-hidden="true" />
              लॉगआउट
            </Button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto px-3 py-2 md:hidden">
          <Link
            to="/register"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md bg-saffron px-3 text-sm font-semibold text-paper"
          >
            <Plus className="size-4" />
            नया पंजीकरण
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
            लॉगआउट
          </button>
        </div>
      </header>

      <div className="lg:flex lg:min-h-[calc(100dvh-4.5rem)]">
        {menuOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-20 bg-navy/40 lg:hidden"
            aria-label="मेनू बंद करें"
            onClick={() => onMenu(false)}
          />
        ) : null}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 overflow-y-auto border-r border-line bg-paper px-3 py-4 pt-24 transition-transform duration-200 ease-[var(--ease-out)] lg:sticky lg:top-[4.5rem] lg:z-0 lg:block lg:h-[calc(100dvh-4.5rem)] lg:w-60 lg:shrink-0 lg:pt-5 ${
            menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <p className="px-2 text-xs font-semibold tracking-wide text-muted">नेविगेशन</p>
          <nav className="mt-2 grid gap-1" aria-label="डैशबोर्ड">
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
                  {item.label}
                </button>
              );
            })}
          </nav>
          {isSuperAdmin ? (
            <div className="mt-6 rounded-lg bg-maroon/10 p-2 ring-1 ring-maroon/15">
              <p className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold tracking-wide text-maroon">
                <Shield className="size-3.5" aria-hidden="true" />
                SUPER ADMIN
              </p>
              <nav className="mt-1 grid gap-1" aria-label="सुपर एडमिन">
                <button
                  type="button"
                  aria-current={section === "super" ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-left text-sm font-medium ${
                    section === "super" ? "bg-maroon text-paper" : "text-navy hover:bg-paper"
                  }`}
                  onClick={() => onSection("super")}
                >
                  <Shield className="size-4 shrink-0" aria-hidden="true" />
                  Super Admin
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
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : null}
        </aside>

        <main className="min-w-0 flex-1 px-3 py-4 sm:px-5 sm:py-6">{children}</main>
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
        <h1 className="font-display text-2xl leading-tight text-navy">{title}</h1>
      </div>
      {action}
    </div>
  );
}
