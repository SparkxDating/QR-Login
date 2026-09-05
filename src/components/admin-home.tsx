import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminRole } from "@/lib/admin";
import { BLOCKS, CAMP, STATUSES, type RegistrationStatus } from "@/lib/camp";
import { registrationCsv, type AdminListFilters, type RegistrationRow } from "@/lib/registrations";
import {
  bulkUpdateRegistrationStatus,
  checkAdminSession,
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
import { AdminShell, SectionTitle, type AdminSection } from "@/components/admin-shell";
import { tStatus, useDashboardI18n } from "@/components/dashboard-locale";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Eye,
  Percent,
  Printer,
  Search,
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
  const { t } = useDashboardI18n();
  const [sessionRole, setSessionRole] = useState<AdminRole>(role);
  const isSuperAdmin = sessionRole === "super_admin";
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
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<RegistrationStatus>("screened");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [profile, setProfile] = useState<RegistrationRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RegistrationRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [section, setSection] = useState<AdminSection>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
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
      setError(err instanceof Error ? err.message : t("error.loadData"));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    const t = setTimeout(() => {
      void load();
    }, 280);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setRegisterUrl(`${window.location.origin}/register`);
  }, []);

  useEffect(() => {
    setSessionRole(role);
  }, [role]);

  useEffect(() => {
    void checkAdminSession()
      .then((res) => {
        if (res.role === "admin" || res.role === "super_admin") setSessionRole(res.role);
      })
      .catch(() => undefined);
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
      setRows((list) =>
        list.map((row) => (byId.get(row.id) ? { ...byId.get(row.id)!, duplicate: row.duplicate } : row)),
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.status"));
    } finally {
      setBulkBusy(false);
    }
  }

  function onBulkCsv() {
    if (selectedRows.length === 0) return;
    downloadTextFile(registrationCsv(selectedRows), "trishakti-selected.csv", "text/csv;charset=utf-8");
  }

  async function onBulkPdf() {
    if (bulkBusy || selectedRows.length === 0) return;
    if (selectedRows.length > 12) {
      setError(t("error.maxPdfs"));
      return;
    }
    setBulkBusy(true);
    setError("");
    try {
      for (const row of selectedRows) {
        await saveRegistrationPdf(row.registrationNumber, slipDetailsFromRow(row));
      }
    } catch {
      setError(t("error.somePdfs"));
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
      setDeleteError(err instanceof Error ? err.message : t("error.delete"));
    } finally {
      setDeleteBusy(false);
    }
  }

  const qrValue = registerUrl;

  function goTo(next: AdminSection, anchor?: string) {
    setSection(next);
    setMenuOpen(false);
    if (anchor) {
      window.setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  return (
    <AdminShell
      isSuperAdmin={isSuperAdmin}
      section={section}
      onSection={goTo}
      menuOpen={menuOpen}
      onMenu={setMenuOpen}
      onExport={() => void onExport()}
      onLogout={() => void onLogout()}
    >
      {notice ? (
        <p className="mb-4 rounded-md bg-success/12 px-3 py-2 text-sm text-success" role="status">
          {notice}
        </p>
      ) : null}

      {section === "overview" ? (
        <div>
          <SectionTitle kicker={t("kicker.dashboard")} title={t("title.overview")} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <Stat
              label={t("kpi.totalRegistrations")}
              value={visits.totalRegistrations || total}
              hint={t("kpi.totalRegistrationsHint")}
              tone="maroon"
              icon={<ClipboardList className="size-5" aria-hidden="true" />}
              trend={
                today > 0
                  ? { label: t("kpi.todayCount", { n: today }), tone: "success" }
                  : { label: t("kpi.todayZero"), tone: "muted" }
              }
            />
            <Stat
              label={t("kpi.totalVisits")}
              value={visits.totalVisits}
              hint={t("kpi.totalVisitsHint")}
              tone="navy"
              icon={<Eye className="size-5" aria-hidden="true" />}
            />
            <Stat
              label={t("kpi.uniqueVisitors")}
              value={visits.uniqueVisitors}
              hint={t("kpi.uniqueVisitorsHint")}
              tone="info"
              icon={<Users className="size-5" aria-hidden="true" />}
            />
            <Stat
              label={t("kpi.onlineNow")}
              value={visits.online}
              hint={t("kpi.onlineHint")}
              tone="success"
              icon={<UserCheck className="size-5" aria-hidden="true" />}
              trend={
                visits.online > 0
                  ? { label: t("kpi.active"), tone: "success" }
                  : { label: t("kpi.noneActive"), tone: "muted" }
              }
            />
            <Stat
              label={t("kpi.conversion")}
              value={visits.conversionRate}
              suffix="%"
              hint={t("kpi.conversionHint")}
              tone="saffron"
              icon={<Percent className="size-5" aria-hidden="true" />}
            />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <Stat
              label={t("kpi.todayRegistrations")}
              value={today}
              tone="saffron"
              icon={<CalendarDays className="size-5" aria-hidden="true" />}
            />
            <Stat label={t("kpi.pending")} value={pending} tone="info" icon={<Clock className="size-5" aria-hidden="true" />} />
            <Stat
              label={t("kpi.screened")}
              value={screened}
              tone="navy"
              icon={<Stethoscope className="size-5" aria-hidden="true" />}
            />
            <Stat
              label={t("kpi.selectedForOp")}
              value={selectedCount}
              tone="saffron"
              icon={<UserCheck className="size-5" aria-hidden="true" />}
            />
            <Stat
              label={t("kpi.opComplete")}
              value={completed}
              tone="success"
              icon={<CheckCircle2 className="size-5" aria-hidden="true" />}
            />
          </div>
        </div>
      ) : null}

      {section === "registrations" ? (
        <div>
          <SectionTitle kicker={t("kicker.patients")} title={t("title.registrations")} />
          <Card>
            <h2 className="flex items-center gap-2 font-display text-lg text-navy">
              <Search className="size-4" aria-hidden="true" />
              {t("filters.title")}
            </h2>
            <p className="mt-1 text-xs text-muted">{t("filters.workflow")}</p>
            <div className="mt-4 rounded-lg bg-cream p-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label className="mb-1">{t("filters.regNo")}</Label>
                  <Input
                    value={filters.registrationNumber}
                    onChange={(e) => setFilter("registrationNumber", e.target.value)}
                    placeholder="TSF-2026-00001"
                  />
                </div>
                <div>
                  <Label className="mb-1">{t("filters.name")}</Label>
                  <Input
                    value={filters.name}
                    onChange={(e) => setFilter("name", e.target.value)}
                    placeholder={t("filters.namePlaceholder")}
                  />
                </div>
                <div>
                  <Label className="mb-1">{t("filters.mobile")}</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={10}
                    value={filters.mobile}
                    onChange={(e) => setFilter("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder={t("filters.mobilePlaceholder")}
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label className="mb-1">{t("filters.village")}</Label>
                <Input
                  list="village-list"
                  value={filters.village}
                  onChange={(e) => setFilter("village", e.target.value)}
                  placeholder={t("filters.village")}
                />
                <datalist id="village-list">
                  {villageOptions.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label className="mb-1">{t("filters.nyaya")}</Label>
                <Input
                  list="nyaya-list"
                  value={filters.nyayaPanchayat}
                  onChange={(e) => setFilter("nyayaPanchayat", e.target.value)}
                  placeholder={t("filters.nyaya")}
                />
                <datalist id="nyaya-list">
                  {nyayaOptions.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label className="mb-1">{t("filters.block")}</Label>
                <NativeSelect
                  id="filter-block"
                  value={filters.block}
                  onChange={(e) => setFilter("block", e.target.value)}
                >
                  <option value="">{t("filters.all")}</option>
                  {BLOCKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label className="mb-1">{t("filters.status")}</Label>
                <NativeSelect
                  id="filter-status"
                  value={filters.status}
                  onChange={(e) => setFilter("status", e.target.value)}
                >
                  <option value="">{t("filters.all")}</option>
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {tStatus(t, s.value)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <Label className="mb-1">{t("filters.regDate")}</Label>
                <Input type="date" value={filters.date} onChange={(e) => setFilter("date", e.target.value)} />
              </div>
              <div>
                <Label className="mb-1">{t("filters.dateFrom")}</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilter("dateFrom", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1">{t("filters.dateTo")}</Label>
                <Input type="date" value={filters.dateTo} onChange={(e) => setFilter("dateTo", e.target.value)} />
              </div>
            </div>
          </Card>

          {selected.size > 0 ? (
            <div className="sticky bottom-3 z-20 mt-5 rounded-xl bg-navy p-3 text-paper shadow-[var(--shadow-lift)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <p className="text-sm font-medium">
                  {t("bulk.selected")} <span className="tabular-nums">{selected.size}</span>
                </p>
                <StatusSelect
                  className="min-h-10 w-auto min-w-44 bg-paper text-navy"
                  value={bulkStatus}
                  onChange={(value) => setBulkStatus(value as RegistrationStatus)}
                />
                <Button size="sm" disabled={bulkBusy} onClick={() => void onBulkStatus()}>
                  {bulkBusy ? t("bulk.applying") : t("bulk.applyStatus")}
                </Button>
                <Button variant="secondary" size="sm" disabled={bulkBusy} onClick={onBulkCsv}>
                  <Download className="size-4" aria-hidden="true" />
                  {t("bulk.csv")}
                </Button>
                <Button variant="secondary" size="sm" disabled={bulkBusy} onClick={() => void onBulkPdf()}>
                  <Download className="size-4" aria-hidden="true" />
                  {t("bulk.pdf")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-paper"
                  onClick={() => setSelected(new Set())}
                >
                  {t("bulk.clear")}
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
        </div>
      ) : null}

      {section === "analytics" ? (
        <div>
          <SectionTitle kicker={t("kicker.analysis")} title={t("title.analytics")} />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat
              label={t("kpi.onlineNow")}
              value={visits.online}
              hint={t("kpi.onlineHint")}
              tone="success"
              icon={<UserCheck className="size-5" aria-hidden="true" />}
              trend={
                visits.online > 0
                  ? { label: t("kpi.active"), tone: "success" }
                  : { label: t("kpi.noneActive"), tone: "muted" }
              }
            />
            <Stat
              label={t("kpi.uniqueVisitors")}
              value={visits.uniqueVisitors}
              hint={t("kpi.uniqueVisitorsHint")}
              tone="info"
              icon={<Users className="size-5" aria-hidden="true" />}
            />
            <Stat
              label={t("kpi.totalRegistrations")}
              value={visits.totalRegistrations || total}
              tone="maroon"
              icon={<CalendarDays className="size-5" aria-hidden="true" />}
            />
          </div>
          <VisitAnalytics
            visitsByDay={visits.visitsByDay}
            registrationsByDay={visits.registrationsByDay}
            visitsVsRegistrations={visits.visitsVsRegistrations}
            detailed={isSuperAdmin && visits.detailed}
            daily={isSuperAdmin ? visits.daily : []}
          />
          <AdminAnalytics byDate={byDate} byBlock={byBlock} byStatus={byStatus} />
        </div>
      ) : null}

      {section === "reports" ? (
        <div>
          <SectionTitle kicker={t("kicker.export")} title={t("title.reports")} />
          <Card>
            <h2 className="font-display text-lg text-navy">{t("reports.csvTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("reports.csvHint")}</p>
            <Button className="mt-4" size="sm" onClick={() => void onExport()}>
              <Download className="size-4" aria-hidden="true" />
              {t("reports.csvDownload")}
            </Button>
          </Card>
          <Card className="mt-5">
            <h2 className="font-display text-lg text-navy">{t("reports.qrTitle")}</h2>
            <p className="mt-1 text-sm text-muted">{t("reports.qrHint")}</p>
            <p className="mt-1 text-sm font-medium text-saffron">{CAMP.dateLine}</p>
            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              <QrCode id="registration-qr" value={qrValue} label={t("reports.qrLabel")} />
              <div className="min-w-0 flex-1">
                <p className="break-all rounded-md bg-cream px-3 py-2 text-sm text-navy">{qrValue}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void navigator.clipboard.writeText(qrValue)}
                  >
                    {t("reports.copyLink")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadQrPng("registration-qr", "trishakti-register-qr.png")}
                  >
                    <Download className="size-4" aria-hidden="true" />
                    {t("reports.qrDownload")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => printQr("registration-qr", CAMP.dateLine, qrValue)}
                  >
                    <Printer className="size-4" aria-hidden="true" />
                    {t("reports.print")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {section === "settings" ? (
        <div>
          <SectionTitle kicker={t("kicker.account")} title={t("title.settings")} />
          {isSuperAdmin ? (
            <Card>
              <p className="text-sm text-muted">{t("settings.superHint")}</p>
              <Button className="mt-4" size="sm" variant="secondary" onClick={() => goTo("super", "sa-security")}>
                {t("settings.openSuper")}
              </Button>
            </Card>
          ) : (
            <AdminPasswordChangeForm onCancel={() => goTo("overview")} />
          )}
        </div>
      ) : null}

      {section === "super" && isSuperAdmin ? (
        <div>
          <SectionTitle kicker={t("kicker.security")} title={t("title.superAdmin")} />
          <AdminSecurityPanel onRequestDelete={setPendingDelete} />
        </div>
      ) : null}

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
    </AdminShell>
  );
}
