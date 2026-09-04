import { useEffect, useState, type FormEvent } from "react";
import { AUDIT_ACTION_LABELS, roleLabel } from "@/lib/admin";
import {
  listAdminAccounts,
  listAdminAuditLogs,
  logoutAllAdminSessions,
  resetAdminPassword,
} from "@/lib/admin-auth.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoaderCircle, Shield } from "lucide-react";

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("hi-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AdminSecurityPanel({ onClose }: { onClose: () => void }) {
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
  const [busy, setBusy] = useState<"reset" | "logout" | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [accountRes, logRes] = await Promise.all([listAdminAccounts(), listAdminAuditLogs()]);
      setAccounts(accountRes.accounts);
      setLogs(logRes.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "सुरक्षा डेटा नहीं मिल सका।");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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
      setNotice("एडमिन पासवर्ड रीसेट हो गया। पिछले एडमिन सत्र समाप्त कर दिए गए।");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "पासवर्ड नहीं बदला जा सका।");
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
      setNotice("सभी एडमिन सत्र समाप्त कर दिए गए।");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "सत्र समाप्त नहीं हो सके।");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg text-navy">
            <Shield className="size-4" aria-hidden="true" />
            सुपर एडमिन सुरक्षा
          </h2>
          <p className="mt-1 text-sm text-muted">
            भूमिका, पासवर्ड रीसेट, गतिविधि लॉग और सत्र नियंत्रण।
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={onClose}>
          बंद करें
        </Button>
      </div>

      {loading ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted">
          <LoaderCircle className="size-4 animate-spin" />
          लोड हो रहा है…
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mt-3 text-sm text-success" role="status">
          {notice}
        </p>
      ) : null}

      <h3 className="mt-5 font-display text-base text-navy">उपयोगकर्ता और भूमिका</h3>
      <ul className="mt-2 grid gap-2">
        {accounts.map((account) => (
          <li
            key={`${account.role}:${account.username}`}
            className="rounded-md bg-cream px-3 py-2 text-sm"
          >
            <p className="font-medium text-navy">{account.username}</p>
            <p className="text-muted">
              {roleLabel(account.role)} · {account.source === "environment" ? "पर्यावरण" : "डेटाबेस"}
              {account.passwordSet ? "" : " · पासवर्ड सेट नहीं"}
            </p>
          </li>
        ))}
      </ul>

      <form onSubmit={onReset} className="mt-5 max-w-md">
        <h3 className="font-display text-base text-navy">एडमिन पासवर्ड रीसेट</h3>
        <p className="mt-1 text-xs text-muted">
          सामान्य एडमिन का नया पासवर्ड सेट करें। सुपर एडमिन पासवर्ड पर्यावरण में रहता है।
        </p>
        <Label className="mt-3 mb-1.5" htmlFor="reset-admin-new">
          नया एडमिन पासवर्ड
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
          नया पासवर्ड दोबारा दर्ज करें
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
          {busy === "reset" ? "सेट हो रहा है…" : "पासवर्ड रीसेट करें"}
        </Button>
      </form>

      <div className="mt-5">
        <h3 className="font-display text-base text-navy">सत्र</h3>
        <p className="mt-1 text-xs text-muted">सभी सामान्य एडमिन को लॉगआउट करें। आपका सुपर एडमिन सत्र बना रहता है।</p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          disabled={busy !== null}
          onClick={() => void onLogoutAll()}
        >
          {busy === "logout" ? "समाप्त हो रहा है…" : "सभी एडमिन सत्र समाप्त करें"}
        </Button>
      </div>

      <h3 className="mt-6 font-display text-base text-navy">गतिविधि लॉग</h3>
      {logs.length === 0 ? (
        <p className="mt-2 text-sm text-muted">अभी कोई गतिविधि नहीं।</p>
      ) : (
        <ul className="mt-2 max-h-80 overflow-y-auto rounded-md bg-cream">
          {logs.map((log) => (
            <li key={log.id} className="border-b border-line px-3 py-2 text-sm last:border-b-0">
              <p className="text-navy">
                {AUDIT_ACTION_LABELS[log.action] ?? log.action}
                {log.detail ? <span className="text-muted"> · {log.detail}</span> : null}
              </p>
              <p className="text-xs text-muted">
                {roleLabel(log.actorRole)} · {formatWhen(log.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
