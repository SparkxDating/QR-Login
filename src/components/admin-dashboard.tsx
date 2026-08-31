import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { BLOCKS, CAMP, STATUSES, statusLabel, type RegistrationStatus } from "@/lib/camp";
import type { RegistrationRow } from "@/lib/registrations";
import {
  adminLogin,
  adminLogout,
  checkAdminSession,
  exportRegistrationsCsv,
  listRegistrations,
  updateRegistrationStatus,
} from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "@/components/qr-code";
import { Download, LoaderCircle, LogOut, Search, Users } from "lucide-react";

const TOKEN_KEY = "tsf_admin_token";

function token(): string | undefined {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function saveToken(value: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, value);
  } catch {
    /* ignore */
  }
}

function clearToken() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

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

export function AdminDashboard() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [previewHint, setPreviewHint] = useState(false);

  useEffect(() => {
    let cancelled = false;
    checkAdminSession({ data: { token: token() } })
      .then((res) => {
        if (cancelled) return;
        setAuthed(res.authed);
        setPreviewHint(res.previewHint);
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
        <LoaderCircle className="size-8 animate-spin" aria-label="\u0932\u094b\u0921 \u0939\u094b \u0930\u0939\u093e \u0939\u0948" />
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLogin
        previewHint={previewHint}
        onSuccess={(t) => {
          saveToken(t);
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <AdminHome
      onLogout={async () => {
        await adminLogout();
        clearToken();
        setAuthed(false);
      }}
    />
  );
}

function AdminLogin({
  previewHint,
  onSuccess,
}: {
  previewHint: boolean;
  onSuccess: (token: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await adminLogin({ data: { password } });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess(res.token);
    } catch {
      setError("\u0932\u0949\u0917\u093f\u0928 \u0928\u0939\u0940\u0902 \u0939\u094b \u0938\u0915\u093e\u0964");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream px-4 py-10">
      <form onSubmit={submit} className="mx-auto w-full max-w-md">
        <Card>
          <p className="text-sm font-semibold text-saffron">{CAMP.foundation}</p>
          <h1 className="mt-2 font-display text-2xl text-navy">\u092a\u094d\u0930\u0936\u093e\u0938\u0928 \u0932\u0949\u0917\u093f\u0928</h1>
          <p className="mt-1 text-sm text-muted">\u0915\u0947\u0935\u0932 \u0905\u0927\u093f\u0915\u0943\u0924 \u0915\u093e\u0930\u094d\u092f\u0915\u0930\u094d\u0924\u093e\u0913\u0902 \u0915\u0947 \u0932\u093f\u090f</p>
          <Label className="mt-5 mb-1.5">\u092a\u093e\u0938\u0935\u0930\u094d\u0921</Label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {previewHint ? (
            <p className="mt-2 text-xs text-muted">
              \u092a\u0942\u0930\u094d\u0935\u093e\u0935\u0932\u094b\u0915\u0928 \u092a\u093e\u0938\u0935\u0930\u094d\u0921: <span className="font-medium text-navy">Trishakti@2026</span>
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="mt-5 w-full" disabled={busy}>
            {busy ? "\u091c\u093e\u0901\u091a \u0939\u094b \u0930\u0939\u0940 \u0939\u0948\u2026" : "\u092a\u094d\u0930\u0935\u0947\u0936 \u0915\u0930\u0947\u0902"}
          </Button>
          <p className="mt-4 text-center text-sm">
            <Link to="/register" className="text-maroon hover:underline">
              \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u092a\u0943\u0937\u094d\u0920 \u092a\u0930 \u091c\u093e\u090f\u0901
            </Link>
          </p>
        </Card>
      </form>
    </div>
  );
}

function AdminHome({ onLogout }: { onLogout: () => void }) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [block, setBlock] = useState("");
  const [nyaya, setNyaya] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [nyayas, setNyayas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registerUrl, setRegisterUrl] = useState("/register");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listRegistrations({
        data: {
          token: token(),
          name,
          mobile,
          block,
          nyayaPanchayat: nyaya,
          date,
          status,
        },
      });
      setRows(res.rows);
      setTotal(res.total);
      setToday(res.today);
      setNyayas(res.nyayaPanchayats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "\u0921\u0947\u091f\u093e \u0928\u0939\u0940\u0902 \u092e\u093f\u0932 \u0938\u0915\u093e");
    } finally {
      setLoading(false);
    }
  }, [name, mobile, block, nyaya, date, status]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 280);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setRegisterUrl(`${window.location.origin}/register`);
  }, []);

  const filteredCount = rows.length;
  const nyayaOptions = useMemo(() => nyayas, [nyayas]);

  async function onStatus(id: number, next: string) {
    const updated = await updateRegistrationStatus({
      data: {
        token: token(),
        id,
        status: next as RegistrationStatus,
      },
    });
    setRows((list) => list.map((row) => (row.id === id ? updated : row)));
  }

  async function onExport() {
    const res = await exportRegistrationsCsv({ data: { token: token() } });
    const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trishakti-registrations.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-dvh bg-cream">
      <header className="bg-navy text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs text-saffron-soft">{CAMP.foundation}</p>
            <h1 className="font-display text-xl">\u092a\u094d\u0930\u0936\u093e\u0938\u0928 \u0921\u0948\u0936\u092c\u094b\u0930\u094d\u0921</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => void onExport()}>
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Button>
            <Button variant="ghost" size="sm" className="text-paper" onClick={() => void onLogout()}>
              <LogOut className="size-4" aria-hidden="true" />
              \u0932\u0949\u0917\u0906\u0909\u091f
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat label="\u0915\u0941\u0932 \u092a\u0902\u091c\u0940\u0915\u0930\u0923" value={total} />
          <Stat label="\u0906\u091c \u0915\u0947 \u092a\u0902\u091c\u0940\u0915\u0930\u0923" value={today} />
        </div>

        <Card className="mt-5">
          <h2 className="font-display text-lg text-navy">\u092a\u0902\u091c\u0940\u0915\u0930\u0923 QR \u0915\u094b\u0921</h2>
          <p className="mt-1 text-sm text-muted">
            \u0907\u0938 \u0915\u094b\u0921 \u0915\u094b \u092a\u094b\u0938\u094d\u091f\u0930 \u092f\u093e \u0930\u091c\u093f\u0938\u094d\u091f\u094d\u0930\u0947\u0936\u0928 \u0921\u0947\u0938\u094d\u0915 \u092a\u0930 \u0932\u0917\u093e\u090f\u0901\u0964 \u0938\u094d\u0915\u0948\u0928 \u0915\u0930\u0928\u0947 \u092a\u0930 \u0938\u093e\u0930\u094d\u0935\u091c\u0928\u093f\u0915 \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u092a\u0943\u0937\u094d\u0920 \u0916\u0941\u0932\u0924\u093e \u0939\u0948\u0964
          </p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <QrCode value={registerUrl} label="\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u092a\u0943\u0937\u094d\u0920 \u0915\u093e QR \u0915\u094b\u0921" />
            <div className="min-w-0 flex-1">
              <p className="break-all rounded-md bg-cream px-3 py-2 text-sm text-navy">{registerUrl}</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => void navigator.clipboard.writeText(registerUrl)}
              >
                \u0932\u093f\u0902\u0915 \u0915\u0949\u092a\u0940 \u0915\u0930\u0947\u0902
              </Button>
            </div>
          </div>
        </Card>

        <Card className="mt-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-navy">
            <Search className="size-4" aria-hidden="true" />
            \u0916\u094b\u091c \u0914\u0930 \u092b\u093c\u093f\u0932\u094d\u091f\u0930
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="mb-1">\u0928\u093e\u092e</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="\u0928\u093e\u092e \u0938\u0947 \u0916\u094b\u091c\u0947\u0902" />
            </div>
            <div>
              <Label className="mb-1">\u092e\u094b\u092c\u093e\u0907\u0932</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="\u092e\u094b\u092c\u093e\u0907\u0932 \u0938\u0947 \u0916\u094b\u091c\u0947\u0902"
              />
            </div>
            <div>
              <Label className="mb-1">\u092c\u094d\u0932\u0949\u0915</Label>
              <NativeSelect
                id="filter-block"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
              >
                <option value="">\u0938\u092d\u0940</option>
                {BLOCKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1">\u0928\u094d\u092f\u093e\u092f \u092a\u0902\u091a\u093e\u092f\u0924</Label>
              <Input
                list="nyaya-list"
                value={nyaya}
                onChange={(e) => setNyaya(e.target.value)}
                placeholder="\u0928\u094d\u092f\u093e\u092f \u092a\u0902\u091a\u093e\u092f\u0924"
              />
              <datalist id="nyaya-list">
                {nyayaOptions.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div>
              <Label className="mb-1">\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0924\u093f\u0925\u093f</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1">\u0938\u094d\u0925\u093f\u0924\u093f</Label>
              <NativeSelect
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">\u0938\u092d\u0940</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </Card>

        <div className="mt-5">
          <p className="mb-2 text-sm text-muted">
            \u0926\u093f\u0916\u093e\u090f \u0917\u090f: <span className="tabular-nums font-medium text-navy">{filteredCount}</span>
          </p>
          {error ? (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <LoaderCircle className="size-4 animate-spin" />
              \u0932\u094b\u0921 \u0939\u094b \u0930\u0939\u093e \u0939\u0948\u2026
            </p>
          ) : rows.length === 0 ? (
            <Card>
              <p className="text-center text-muted">\u0915\u094b\u0908 \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0928\u0939\u0940\u0902 \u092e\u093f\u0932\u093e\u0964</p>
            </Card>
          ) : (
            <ul className="grid gap-3">
              {rows.map((row) => (
                <li key={row.id} className="rounded-xl bg-paper p-4 shadow-[var(--shadow-card)]">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg text-navy">{row.name}</p>
                      <p className="tabular-nums text-sm font-semibold text-maroon">
                        {row.registrationNumber}
                      </p>
                    </div>
                    <NativeSelect
                      className="min-h-10 w-auto min-w-44"
                      value={row.status}
                      onChange={(e) => void onStatus(row.id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                    <Item k="\u092a\u093f\u0924\u093e/\u092a\u0924\u093f" v={row.fatherOrHusbandName} />
                    <Item k="\u092e\u094b\u092c\u093e\u0907\u0932" v={row.mobile} />
                    <Item k="\u0917\u094d\u0930\u093e\u092e" v={row.village} />
                    <Item k="\u092a\u094b\u0938\u094d\u091f" v={row.post} />
                    <Item k="\u0928\u094d\u092f\u093e\u092f \u092a\u0902\u091a\u093e\u092f\u0924" v={row.nyayaPanchayat} />
                    <Item k="\u092c\u094d\u0932\u0949\u0915" v={row.block} />
                    <Item k="\u0924\u0939\u0938\u0940\u0932" v={row.tehsil} />
                    <Item k="\u091c\u0928\u092a\u0926" v={row.district} />
                    <Item k="\u0924\u093f\u0925\u093f" v={formatWhen(row.createdAt)} />
                    <Item k="\u0938\u094d\u0925\u093f\u0924\u093f" v={statusLabel(row.status)} />
                  </dl>
                  {row.note ? (
                    <p className="mt-2 text-sm text-muted">
                      <span className="font-medium text-navy">\u0928\u094b\u091f: </span>
                      {row.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-paper p-4 shadow-[var(--shadow-card)]">
      <div className="flex size-11 items-center justify-center rounded-md bg-saffron/12 text-saffron">
        <Users className="size-5" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="font-display text-2xl tabular-nums text-navy">{value}</p>
      </div>
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 text-muted">{k}:</dt>
      <dd className="min-w-0 text-ink">{v}</dd>
    </div>
  );
}
