import { useEffect, useState, type FormEvent } from "react";
import { tAudit, tRole, useDashboardI18n } from "@/components/dashboard-locale";
import {
  listAdminAccounts,
  listAdminAuditLogs,
  logoutAllAdminSessions,
  resetAdminPassword,
} from "@/lib/admin-auth.functions";
import { type RegistrationRow } from "@/lib/registrations";
import { listRegistrations as fetchRegistrations } from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, LoaderCircle, LogOut, Shield, Trash2, UserCog, Activity } from "lucide-react";

function formatWhen(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AdminSecurityPanel({
  onRequestDelete,
}: {
  onRequestDelete: (row: RegistrationRow) => void;
}) {
  const { t, locale } = useDashboardI18n();
  const [accounts, setAccounts] = useState<
    { username: string; role: string; source: string; passwordSet: boolean }[]
  >([]);
  const [logs, setLogs] = useState<
    { id: number; actorRole: string; action: string; detail: string; ip: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<"reset" | "logout" | "find" | null>(null);
  const [regNo, setRegNo] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [accountRes, logRes] = await Promise.all([listAdminAccounts(), listAdminAuditLogs()]);
      setAccounts(accountRes.accounts);
      setLogs(logRes.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("super.loadFail"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onFindDelete(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const q = regNo.trim();
    if (!q) return;
    setBusy("find");
    setError("");
    try {
      const res = await fetchRegistrations({
        data: { registrationNumber: q },
      });
      const match =
        res.rows.find((row) => row.registrationNumber.toLowerCase() === q.toLowerCase()) ??
        res.rows[0];
      if (!match) {
        setError(t("super.notFound"));
        return;
      }
      onRequestDelete(match);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("super.notFound"));
    } finally {
      setBusy(null);
    }
  }

  async function onReset(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy("reset");
    setError("");
    setNotice("");
    try {
      const res = await resetAdminPassword({
        data: { newPassword: next, confirmPassword: confirm },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNext("");
      setConfirm("");
      setNotice(t("super.resetNotice"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("super.passwordFail"));
    } finally {
      setBusy(null);
    }
  }

  async function onLogoutAll() {
    if (busy) return;
    setBusy("logout");
    setError("");
    setNotice("");
    try {
      const res = await logoutAllAdminSessions();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setNotice(t("super.logoutNotice"));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("super.logoutFail"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div id="super-admin" className="grid gap-4">
      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="h-1 bg-maroon" aria-hidden="true" />
        <div className="flex items-start gap-3 p-5 sm:p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-maroon text-paper">
            <Shield className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wide text-maroon">{t("super.restricted")}</p>
            <h2 className="font-display text-xl text-navy">{t("super.title")}</h2>
            <p className="mt-1 text-sm text-muted">{t("super.hint")}</p>
          </div>
        </div>
        {loading ? (
          <p className="flex items-center gap-2 px-5 pb-5 text-sm text-muted sm:px-6">
            <LoaderCircle className="size-4 animate-spin" />
            {t("list.loading")}
          </p>
        ) : null}
        {error ? (
          <p className="px-5 pb-5 text-sm text-danger sm:px-6" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="px-5 pb-5 text-sm text-success sm:px-6" role="status">
            {notice}
          </p>
        ) : null}
      </Card>

      <Card id="sa-delete" className="scroll-mt-24 overflow-hidden p-0 sm:p-0">
        <div className="h-1 bg-danger" aria-hidden="true" />
        <div className="bg-danger/5 p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-base text-navy">
            <Trash2 className="size-4 text-danger" aria-hidden="true" />
            {t("super.deleteTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted">{t("super.deleteHint")}</p>
          <form onSubmit={onFindDelete} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label className="mb-1.5" htmlFor="delete-reg-no">
                {t("super.regNo")}
              </Label>
              <Input
                id="delete-reg-no"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder="TSF-2026-00001"
                required
              />
            </div>
            <Button type="submit" variant="danger" size="sm" disabled={busy !== null}>
              {busy === "find" ? t("super.finding") : t("super.findDelete")}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="sa-security" className="scroll-mt-24 overflow-hidden p-0 sm:p-0">
        <div className="h-1 bg-maroon" aria-hidden="true" />
        <div className="p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-base text-navy">
            <KeyRound className="size-4 text-maroon" aria-hidden="true" />
            {t("super.passwordTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted">{t("super.passwordHint")}</p>
          <form onSubmit={onReset} className="mt-3 max-w-md">
            <Label className="mb-1.5" htmlFor="reset-admin-new">
              {t("super.newAdminPassword")}
            </Label>
            <Input
              id="reset-admin-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              minLength={8}
              maxLength={200}
              required
            />
            <Label className="mt-3 mb-1.5" htmlFor="reset-admin-confirm">
              {t("super.confirmPassword")}
            </Label>
            <Input
              id="reset-admin-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              maxLength={200}
              required
            />
            <Button type="submit" className="mt-4" size="sm" disabled={busy !== null}>
              {busy === "reset" ? t("super.resetting") : t("super.resetPassword")}
            </Button>
          </form>
        </div>
      </Card>

      <Card id="sa-accounts" className="scroll-mt-24 overflow-hidden p-0 sm:p-0">
        <div className="h-1 bg-navy" aria-hidden="true" />
        <div className="p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-base text-navy">
            <UserCog className="size-4 text-navy" aria-hidden="true" />
            {t("super.accounts")}
          </h3>
          <ul className="mt-3 grid gap-2">
            {accounts.map((account) => (
              <li
                key={`${account.role}:${account.username}`}
                className="rounded-md bg-cream px-3 py-2 text-sm"
              >
                <p className="font-medium text-navy">{account.username}</p>
                <p className="text-muted">
                  {tRole(t, account.role)} · {account.source === "environment" ? t("super.sourceEnv") : t("super.sourceDb")}
                  {account.passwordSet ? "" : ` · ${t("super.passwordUnset")}`}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card id="sa-logs" className="scroll-mt-24 overflow-hidden p-0 sm:p-0">
        <div className="h-1 bg-navy" aria-hidden="true" />
        <div className="p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-base text-navy">
            <Activity className="size-4 text-navy" aria-hidden="true" />
            {t("super.logs")}
          </h3>
          {logs.length === 0 ? (
            <p className="mt-2 text-sm text-muted">{t("super.noLogs")}</p>
          ) : (
            <ul className="mt-3 max-h-80 overflow-y-auto rounded-md bg-cream">
              {logs.map((log) => (
                <li key={log.id} className="border-b border-line px-3 py-2 text-sm last:border-b-0">
                  <p className="text-navy">
                    {tAudit(t, log.action)}
                    {log.detail ? <span className="text-muted"> · {log.detail}</span> : null}
                  </p>
                  <p className="text-xs text-muted">
                    {tRole(t, log.actorRole)} · {formatWhen(log.createdAt, locale)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0 sm:p-0">
        <div className="h-1 bg-maroon" aria-hidden="true" />
        <div className="p-5 sm:p-6">
          <h3 className="flex items-center gap-2 font-display text-base text-navy">
            <LogOut className="size-4 text-maroon" aria-hidden="true" />
            {t("super.logoutAllTitle")}
          </h3>
          <p className="mt-1 text-xs text-muted">{t("super.logoutAllHint")}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            disabled={busy !== null}
            onClick={() => void onLogoutAll()}
          >
            {busy === "logout" ? t("super.loggingOut") : t("super.logoutAll")}
          </Button>
        </div>
      </Card>
    </div>
  );
}
