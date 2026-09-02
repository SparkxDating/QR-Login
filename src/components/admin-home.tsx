import { useCallback, useEffect, useMemo, useState } from "react";
import { BLOCKS, CAMP, STATUSES, type RegistrationStatus } from "@/lib/camp";
import type { RegistrationRow } from "@/lib/registrations";
import {
  exportRegistrationsCsv,
  listRegistrations,
  updateRegistrationStatus,
} from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "@/components/qr-code";
import { downloadQrPng, printQr } from "@/lib/qr-print";
import { AdminRegistrationList, Stat } from "@/components/admin-rows";
import { AdminPasswordChangeForm } from "@/components/admin-password";
import { Download, KeyRound, LogOut, Printer, Search } from "lucide-react";

export function AdminHome({ onLogout }: { onLogout: () => void }) {
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
  const [showPassword, setShowPassword] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listRegistrations({
        data: { name, mobile, block, nyayaPanchayat: nyaya, date, status },
      });
      setRows(res.rows);
      setTotal(res.total);
      setToday(res.today);
      setNyayas(res.nyayaPanchayats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "डेटा नहीं मिल सका");
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

  const nyayaOptions = useMemo(() => nyayas, [nyayas]);

  async function onStatus(id: number, next: string) {
    const updated = await updateRegistrationStatus({
      data: { id, status: next as RegistrationStatus },
    });
    setRows((list) => list.map((row) => (row.id === id ? updated : row)));
  }

  async function onExport() {
    const res = await exportRegistrationsCsv();
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

  const qrValue = registerUrl;

  return (
    <div className="min-h-dvh bg-cream">
      <header className="bg-navy text-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs text-gold">{CAMP.foundation}</p>
            <h1 className="font-display text-xl">प्रशासन डैशबोर्ड</h1>
            <p className="text-sm text-saffron-soft">{CAMP.dateLine}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowPassword((open) => !open)}>
              <KeyRound className="size-4" aria-hidden="true" />
              पासवर्ड बदलें
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void onExport()}>
              <Download className="size-4" aria-hidden="true" />
              CSV
            </Button>
            <Button variant="ghost" size="sm" className="text-paper" onClick={() => void onLogout()}>
              <LogOut className="size-4" aria-hidden="true" />
              लॉगआउट
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        {showPassword ? <AdminPasswordChangeForm onCancel={() => setShowPassword(false)} /> : null}
        <div className={`grid gap-3 sm:grid-cols-2${showPassword ? " mt-5" : ""}`}>
          <Stat label="कुल पंजीकरण" value={total} />
          <Stat label="आज के पंजीकरण" value={today} />
        </div>

        <Card className="mt-5">
          <h2 className="font-display text-lg text-navy">पंजीकरण QR कोड</h2>
          <p className="mt-1 text-sm text-muted">
            इस कोड को पोस्टर या रजिस्ट्रेशन डेस्क पर लगाएँ। स्कैन करने पर सार्वजनिक पंजीकरण पृष्ठ
            (/register) खुलता है।
          </p>
          <p className="mt-1 text-sm font-medium text-saffron">{CAMP.dateLine}</p>
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <QrCode id="registration-qr" value={qrValue} label="पंजीकरण पृष्ठ का QR कोड" />
            <div className="min-w-0 flex-1">
              <p className="break-all rounded-md bg-cream px-3 py-2 text-sm text-navy">{qrValue}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void navigator.clipboard.writeText(qrValue)}
                >
                  लिंक कॉपी करें
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => downloadQrPng("registration-qr", "trishakti-register-qr.png")}
                >
                  <Download className="size-4" aria-hidden="true" />
                  QR डाउनलोड
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => printQr("registration-qr", CAMP.dateLine, qrValue)}
                >
                  <Printer className="size-4" aria-hidden="true" />
                  प्रिंट
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="mt-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-navy">
            <Search className="size-4" aria-hidden="true" />
            खोज और फ़िल्टर
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="mb-1">नाम</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="नाम से खोजें" />
            </div>
            <div>
              <Label className="mb-1">मोबाइल</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="मोबाइल से खोजें"
              />
            </div>
            <div>
              <Label className="mb-1">ब्लॉक</Label>
              <NativeSelect id="filter-block" value={block} onChange={(e) => setBlock(e.target.value)}>
                <option value="">सभी</option>
                {BLOCKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1">न्याय पंचायत</Label>
              <Input
                list="nyaya-list"
                value={nyaya}
                onChange={(e) => setNyaya(e.target.value)}
                placeholder="न्याय पंचायत"
              />
              <datalist id="nyaya-list">
                {nyayaOptions.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div>
              <Label className="mb-1">पंजीकरण तिथि</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1">स्थिति</Label>
              <NativeSelect
                id="filter-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">सभी</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </Card>

        <AdminRegistrationList
          rows={rows}
          loading={loading}
          error={error}
          filteredCount={rows.length}
          onStatus={onStatus}
        />
      </main>
    </div>
  );
}
