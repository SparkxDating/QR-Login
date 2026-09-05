import { useEffect, useState } from "react";
import type { AdminRole } from "@/lib/admin";
import { adminLogout, checkAdminSession } from "@/lib/registrations.functions";
import { AdminLogin } from "@/components/admin-login";
import { AdminHome } from "@/components/admin-home";
import { DashboardLocaleProvider, useDashboardI18n } from "@/components/dashboard-locale";
import { LoaderCircle } from "lucide-react";

export function AdminDashboard() {
  return (
    <DashboardLocaleProvider>
      <AdminDashboardInner />
    </DashboardLocaleProvider>
  );
}

function AdminDashboardInner() {
  const { t } = useDashboardI18n();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [role, setRole] = useState<AdminRole>("admin");

  useEffect(() => {
    let cancelled = false;
    checkAdminSession()
      .then((res) => {
        if (cancelled) return;
        setAuthed(res.authed);
        setConfigured(res.configured);
        if (res.role) setRole(res.role);
      })
      .catch(() => {
        if (!cancelled) setAuthed(false);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-cream text-muted">
        <LoaderCircle className="size-8 animate-spin" aria-label={t("loading")} />
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLogin
        configured={configured}
        onSuccess={(nextRole) => {
          setRole(nextRole);
          setAuthed(true);
          void checkAdminSession()
            .then((res) => {
              if (res.role === "admin" || res.role === "super_admin") setRole(res.role);
            })
            .catch(() => undefined);
        }}
        onRecovered={() => setConfigured(true)}
      />
    );
  }

  return (
    <AdminHome
      role={role}
      onLogout={async () => {
        await adminLogout();
        setAuthed(false);
        setRole("admin");
      }}
    />
  );
}
