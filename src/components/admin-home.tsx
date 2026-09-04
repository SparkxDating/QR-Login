import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRole } from "@/lib/admin";
import { roleDisplay } from "@/lib/admin";
import { BLOCKS, CAMP, STATUSES, type RegistrationStatus } from "@/lib/camp";
import { registrationCsv, type AdminListFilters, type RegistrationRow } from "@/lib/registrations";
import {
  bulkUpdateRegistrationStatus,
  deleteRegistration,
  exportRegistrationsCsv,
  listRegistrations,
  updateRegistrationStatus,
} from "@/lib/registrations.functions";
import { getVisitStats } from "@/lib/visits.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode } from "@/components/qr-code";
import { downloadQrPng, printQr } from "@/lib/qr-print";
import { saveRegistrationPdf, slipDetailsFromRow } from "@/lib/registration-pdf";
import { AdminAnalytics, VisitAnalytics } from "@/components/admin-analytics";
import { AdminDeleteDialog } from "@/components/admin-delete";
import { AdminPatientProfile } from "@/components/admin-profile";
import { AdminRegistrationList, Stat, StatusSelect } from "@/components/admin-rows";
import { AdminPasswordChangeForm } from "@/components/admin-password";
import { AdminSecurityPanel } from "@/components/admin-security";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  KeyRound,
  LogOut,
  Printer,
  Search,
  Shield,
  Stethoscope,
  UserCheck,
  Users,
} from "lucide-react";

const emptyFilters = (): AdminListFilters => ({
  registrationNumber: "",
  name: "",
  mobile: "",
  village: "",
  block: "",
  nyayaPanchayat: "",
  date: "",
  dateFrom: "",
  dateTo: "",
  status: "",
});

function downloadTextFile(contents: string, filename: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AdminHome({ role, onLogout }: { role: AdminRole; onLogout: () => void }) {
  const isSuperAdmin = role === "super_admin";
  const [filters, setFilters] = useState<AdminListFilters>(emptyFilters);
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [pending, setPending] = useState(0);
  const [screened, setScreened] = useState(0);
  const [selectedCount, setSelectedCount] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [nyayas, setNyayas] = useState<string[]>([]);
  const [villages, setVillages] = useState<string[]>([]);
  const [byDate, setByDate] = useState<{ day: string; n: number }[]>([]);
  const [byBlock, setByBlock] = useState<{ block: string; n: number }[]>([]);
  const [byStatus, setByStatus] = useState<{ status: string; n: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [registerUrl, setRegisterUrl] = useState("/register");
  const [showPassword, setShowPassword] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<RegistrationStatus>("screened");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [profile, setProfile] = useState<RegistrationRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RegistrationRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [visits, setVisits] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    online: 0,
    totalRegistrations: 0,
    conversionRate: 0,
    visitsByDay: [] as { day: string; n: number }[],
    registrationsByDay: [] as { day: string; n: number }[],
    visitsVsRegistrations: [] as { day: string; visits: number; registrations: number }[],
    daily: [] as { day: string; visits: number; uniques: number; registrations: number }[],
    detailed: false as boolean,
  });

  const setFilter = <K extends keyof AdminListFilters>(key: K, value: AdminListFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [res, visitRes] = await Promise.all([
        listRegistrations({ data: filters }),
        getVisitStats().catch(() => null),
      ]);
      setRows(res.rows);
      setTotal(res.total);
      setToday(res.today);
      setPending(res.pending);
      setScreened(res.screened);
      setSelectedCount(res.selected);
      setCompleted(res.completed);
      setNyayas(res.nyayaPanchayats);
      setVillages(res.villages);
      setByDate(res.byDate);
      setByBlock(res.byBlock);
      setByStatus(res.byStatus);
      if (visitRes) {
        setVisits({
          totalVisits: visitRes.totalVisits,
          uniqueVisitors: visitRes.uniqueVisitors,
          online: visitRes.online,
          totalRegistrations: visitRes.totalRegistrations,
          conversionRate: visitRes.conversionRate,
          visitsByDay: visitRes.visitsByDay,
          registrationsByDay: visitRes.registrationsByDay,
          visitsVsRegistrations: visitRes.visitsVsRegistrations,
          daily: visitRes.daily,
          detailed: visitRes.detailed,
        });
      }
      setSelected((prev) => {
        const ids = new Set(res.rows.map((row) => row.id));
        const next = new Set<number>();
        for (const id of prev) if (ids.has(id)) next.add(id);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "डेटा नहीं मिल सका");
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
  const villageOptions = useMemo(() => villages, [villages]);
  const selectedRows = useMemo(() => rows.filter((row) => selected.has(row.id)), [rows, selected]);

  function mergeRow(updated: RegistrationRow) {
    setRows((list) =>
      list.map((row) =>
        row.id === updated.id ? { ...updated, duplicate: updated.duplicate || row.duplicate } : row,
      ),
    );
    setProfile((current) =>
      current && current.id === updated.id
        ? { ...updated, duplicate: updated.duplicate || current.duplicate }
        : current,
    );
  }

  async function onStatus(id: number, next: string) {
    const updated = await updateRegistrationStatus({
      data: { id, status: next as RegistrationStatus },
    });
    mergeRow(updated);
  }

  async function onExport() {
    const res = await exportRegistrationsCsv({ data: filters });
    downloadTextFile(res.csv, "trishakti-registrations.csv", "text/csv;charset=utf-8");
  }

  async function onBulkStatus() {
    if (selected.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    setError("");
    try {
      const res = await bulkUpdateRegistrationStatus({
        data: { ids: [...selected], status: bulkStatus },
      });
      const byId = new Map(res.rows.map((row) => [row.id, row]));
      setRows((list) => list.map((row) => (byId.get(row.id) ? { ...byId.get(row.id)!, duplicate: row.duplicate } : row)));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "स्थिति नहीं बदली जा सकी।");
    } finally {
      setBulkBusy(false);
    }
  }

  function onBulkCsv() {
    if (selectedRows.length === 0) return;
    downloadTextFile(
      registrationCsv(selectedRows),
      "trishakti-selected.csv",
      "text/csv;charset=utf-8",
    );
  }

  async function onBulkPdf() {
    if (bulkBusy || selectedRows.length === 0) return;
    if (selectedRows.length > 12) {
      setError("एक साथ अधिकतम 12 स्लिप PDF बनाएँ।");
      return;
    }
    setBulkBusy(true);
    setError("");
    try {
      for (const row of selectedRows) {
        await saveRegistrationPdf(row.registrationNumber, slipDetailsFromRow(row));
      }
    } catch {
      setError("कुछ स्लिप PDF नहीं बन सकीं। कृपया पुनः प्रयास करें।");
    } finally {
      setBulkBusy(false);
    }
  }

  async function onConfirmDelete() {
    if (!pendingDelete || deleteBusy) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const res = await deleteRegistration({ data: { id: pendingDelete.id, confirm: true } });
      setNotice(res.message);
      setPendingDelete(null);
      setProfile((current) => (current && current.id === pendingDelete.id ? null : current));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(pendingDelete.id);
        return next;
      });
      await load();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "पंजीकरण नहीं हटाया जा सका।");
    } finally {
      setDeleteBusy(false);
    }
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
            <p className="mt-1 inline-flex items-center gap-1 rounded-sm bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
              {isSuperAdmin ? <Shield className="size-3" aria-hidden="true" /> : null}
              {roleDisplay(role)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => document.getElementById("super-admin")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Shield className="size-4" aria-hidden="true" />
                ⚙️ Super Admin
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setShowPassword((open) => !open)}>
                <KeyRound className="size-4" aria-hidden="true" />
                पासवर्ड बदलें
              </Button>
            )}
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
        {notice ? (
          <p className="mb-4 rounded-md bg-success/12 px-3 py-2 text-sm text-success" role="status">
            {notice}
          </p>
        ) : null}
        {showPassword && !isSuperAdmin ? (
          <AdminPasswordChangeForm onCancel={() => setShowPassword(false)} />
        ) : null}
        {isSuperAdmin ? (
          <AdminSecurityPanel onRequestDelete={setPendingDelete} />
        ) : null}
        <div className={`grid grid-cols-2 gap-3 lg:grid-cols-5${showPassword || isSuperAdmin ? " mt-5" : ""}`}>
          <Stat
            label="👁️ Total Link Visits"
            value={visits.totalVisits}
            icon={<Eye className="size-5" aria-hidden="true" />}
          />
          <Stat
            label="👤 Unique Visitors"
            value={visits.uniqueVisitors}
            icon={<Users className="size-5" aria-hidden="true" />}
          />
          <Stat
            label="🟢 Currently Online"
            value={visits.online}
            icon={<UserCheck className="size-5" aria-hidden="true" />}
          />
          <Stat
            label="📝 Total Registrations"
            value={visits.totalRegistrations || total}
            icon={<CalendarDays className="size-5" aria-hidden="true" />}
          />
          <Stat
            label="📈 Conversion Rate"
            value={visits.conversionRate}
            suffix="%"
            icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
          />
        </div>

        <VisitAnalytics
          visitsByDay={visits.visitsByDay}
          registrationsByDay={visits.registrationsByDay}
          visitsVsRegistrations={visits.visitsVsRegistrations}
          detailed={isSuperAdmin && visits.detailed}
          daily={isSuperAdmin ? visits.daily : []}
        />

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="कुल पंजीकरण" value={total} icon={<Users className="size-5" aria-hidden="true" />} />
          <Stat
            label="आज के पंजीकरण"
            value={today}
            icon={<CalendarDays className="size-5" aria-hidden="true" />}
          />
          <Stat label="लंबित" value={pending} icon={<Clock className="size-5" aria-hidden="true" />} />
          <Stat
            label="जाँच पूर्ण"
            value={screened}
            icon={<Stethoscope className="size-5" aria-hidden="true" />}
          />
          <Stat
            label="ऑपरेशन हेतु चयनित"
            value={selectedCount}
            icon={<UserCheck className="size-5" aria-hidden="true" />}
          />
          <Stat
            label="ऑपरेशन पूर्ण"
            value={completed}
            icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
          />
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

        <AdminAnalytics byDate={byDate} byBlock={byBlock} byStatus={byStatus} />

        <Card className="mt-5">
          <h2 className="flex items-center gap-2 font-display text-lg text-navy">
            <Search className="size-4" aria-hidden="true" />
            खोज और फ़िल्टर
          </h2>
          <p className="mt-1 text-xs text-muted">
            कार्यप्रवाह: पंजीकृत → जाँच पूर्ण → ऑपरेशन हेतु चयनित → ऑपरेशन निर्धारित → ऑपरेशन पूर्ण →
            फॉलो-अप पूर्ण
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="mb-1">पंजीकरण संख्या</Label>
              <Input
                value={filters.registrationNumber}
                onChange={(e) => setFilter("registrationNumber", e.target.value)}
                placeholder="TSF-2026-00001"
              />
            </div>
            <div>
              <Label className="mb-1">नाम</Label>
              <Input
                value={filters.name}
                onChange={(e) => setFilter("name", e.target.value)}
                placeholder="नाम से खोजें"
              />
            </div>
            <div>
              <Label className="mb-1">मोबाइल</Label>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={filters.mobile}
                onChange={(e) => setFilter("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="मोबाइल से खोजें"
              />
            </div>
            <div>
              <Label className="mb-1">ग्राम</Label>
              <Input
                list="village-list"
                value={filters.village}
                onChange={(e) => setFilter("village", e.target.value)}
                placeholder="ग्राम"
              />
              <datalist id="village-list">
                {villageOptions.map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
            </div>
            <div>
              <Label className="mb-1">न्याय पंचायत</Label>
              <Input
                list="nyaya-list"
                value={filters.nyayaPanchayat}
                onChange={(e) => setFilter("nyayaPanchayat", e.target.value)}
                placeholder="न्याय पंचायत"
              />
              <datalist id="nyaya-list">
                {nyayaOptions.map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div>
              <Label className="mb-1">ब्लॉक</Label>
              <NativeSelect
                id="filter-block"
                value={filters.block}
                onChange={(e) => setFilter("block", e.target.value)}
              >
                <option value="">सभी</option>
                {BLOCKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1">स्थिति</Label>
              <NativeSelect
                id="filter-status"
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
              >
                <option value="">सभी</option>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div>
              <Label className="mb-1">पंजीकरण तिथि</Label>
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilter("date", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1">तिथि से</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilter("dateFrom", e.target.value)}
              />
            </div>
            <div>
              <Label className="mb-1">तिथि तक</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilter("dateTo", e.target.value)}
              />
            </div>
          </div>
        </Card>

        {selected.size > 0 ? (
          <div className="sticky bottom-3 z-20 mt-5 rounded-xl bg-navy p-3 text-paper shadow-[var(--shadow-lift)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="text-sm font-medium">
                चयनित: <span className="tabular-nums">{selected.size}</span>
              </p>
              <StatusSelect
                className="min-h-10 w-auto min-w-44 bg-paper text-navy"
                value={bulkStatus}
                onChange={(value) => setBulkStatus(value as RegistrationStatus)}
              />
              <Button size="sm" disabled={bulkBusy} onClick={() => void onBulkStatus()}>
                {bulkBusy ? "लागू हो रहा है…" : "स्थिति लागू करें"}
              </Button>
              <Button variant="secondary" size="sm" disabled={bulkBusy} onClick={onBulkCsv}>
                <Download className="size-4" aria-hidden="true" />
                चयनित CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={bulkBusy}
                onClick={() => void onBulkPdf()}
              >
                <Download className="size-4" aria-hidden="true" />
                चयनित PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-paper"
                onClick={() => setSelected(new Set())}
              >
                चयन हटाएँ
              </Button>
            </div>
          </div>
        ) : null}

        <AdminRegistrationList
          rows={rows}
          loading={loading}
          error={error}
          filteredCount={rows.length}
          selected={selected}
          canDelete={isSuperAdmin}
          onToggle={(id) => {
            setSelected((prev) => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            });
          }}
          onToggleAll={() => {
            setSelected((prev) => {
              if (rows.length > 0 && rows.every((row) => prev.has(row.id))) return new Set();
              return new Set(rows.map((row) => row.id));
            });
          }}
          onStatus={onStatus}
          onOpen={setProfile}
          onDelete={setPendingDelete}
        />
      </main>

      {profile ? (
        <AdminPatientProfile
          row={profile}
          canDelete={isSuperAdmin}
          onClose={() => setProfile(null)}
          onSaved={(next) => {
            mergeRow(next);
            void load();
          }}
          onDelete={setPendingDelete}
        />
      ) : null}

      {pendingDelete ? (
        <AdminDeleteDialog
          row={pendingDelete}
          busy={deleteBusy}
          error={deleteError}
          onCancel={() => {
            if (deleteBusy) return;
            setPendingDelete(null);
            setDeleteError("");
          }}
          onConfirm={() => void onConfirmDelete()}
        />
      ) : null}
    </div>
  );
}
