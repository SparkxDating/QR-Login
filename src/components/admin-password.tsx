import { useState, type FormEvent } from "react";
import { changeAdminPassword, recoverAdminPassword } from "@/lib/admin-auth.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function PasswordFields({
  currentId,
  includeCurrent,
  current,
  next,
  confirm,
  onCurrent,
  onNext,
  onConfirm,
}: {
  currentId: string;
  includeCurrent: boolean;
  current: string;
  next: string;
  confirm: string;
  onCurrent: (value: string) => void;
  onNext: (value: string) => void;
  onConfirm: (value: string) => void;
}) {
  return (
    <>
      {includeCurrent ? (
        <>
          <Label className="mt-4 mb-1.5" htmlFor={`${currentId}-current`}>
            वर्तमान पासवर्ड
          </Label>
          <Input
            id={`${currentId}-current`}
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => onCurrent(e.target.value)}
            required
          />
        </>
      ) : null}
      <Label className="mt-4 mb-1.5" htmlFor={`${currentId}-new`}>
        नया पासवर्ड
      </Label>
      <Input
        id={`${currentId}-new`}
        type="password"
        autoComplete="new-password"
        value={next}
        onChange={(e) => onNext(e.target.value)}
        minLength={8}
        maxLength={200}
        required
      />
      <Label className="mt-4 mb-1.5" htmlFor={`${currentId}-confirm`}>
        नया पासवर्ड दोबारा दर्ज करें
      </Label>
      <Input
        id={`${currentId}-confirm`}
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => onConfirm(e.target.value)}
        minLength={8}
        maxLength={200}
        required
      />
    </>
  );
}

export function AdminPasswordChangeForm({ onCancel }: { onCancel: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await changeAdminPassword({
        data: { currentPassword: current, newPassword: next, confirmPassword: confirm },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess("पासवर्ड बदल गया।");
    } catch {
      setError("पासवर्ड नहीं बदला जा सका। पुनः प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-card)]">
      <div className="h-1 bg-navy" aria-hidden="true" />
      <div className="p-5">
      <h2 className="font-display text-lg text-navy">पासवर्ड बदलें</h2>
      <p className="mt-1 text-sm text-muted">वर्तमान पासवर्ड की पुष्टि के बाद नया पासवर्ड सेट होगा।</p>
      <PasswordFields
        currentId="change"
        includeCurrent
        current={current}
        next={next}
        confirm={confirm}
        onCurrent={setCurrent}
        onNext={setNext}
        onConfirm={setConfirm}
      />
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-success" role="status">
          {success}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "सहेजा जा रहा है…" : "पासवर्ड सहेजें"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          बंद करें
        </Button>
      </div>
      </div>
    </form>
  );
}

export function AdminPasswordRecoverForm({
  onBack,
  onRecovered,
}: {
  onBack: () => void;
  onRecovered?: () => void;
}) {
  const [code, setCode] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const res = await recoverAdminPassword({
        data: { recoveryCode: code, newPassword: next, confirmPassword: confirm },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCode("");
      setNext("");
      setConfirm("");
      setSuccess("पासवर्ड बदल गया। नए पासवर्ड से लॉगिन करें।");
      onRecovered?.();
    } catch {
      setError("पासवर्ड नहीं बदला जा सका। पुनः प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <h1 className="mt-2 font-display text-2xl text-navy">पासवर्ड भूल गए?</h1>
      <p className="mt-1 text-sm text-muted">रिकवरी कोड सत्यापित होने पर नया पासवर्ड सेट होगा।</p>
      <Label className="mt-5 mb-1.5" htmlFor="recovery-code">
        रिकवरी कोड
      </Label>
      <Input
        id="recovery-code"
        type="password"
        autoComplete="off"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        required
      />
      <PasswordFields
        currentId="recover"
        includeCurrent={false}
        current=""
        next={next}
        confirm={confirm}
        onCurrent={() => undefined}
        onNext={setNext}
        onConfirm={setConfirm}
      />
      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 text-sm text-success" role="status">
          {success}
        </p>
      ) : null}
      <Button type="submit" className="mt-5 w-full" disabled={busy}>
        {busy ? "सहेजा जा रहा है…" : "नया पासवर्ड सेट करें"}
      </Button>
      <p className="mt-4 text-center text-sm">
        <button type="button" className="text-maroon hover:underline" onClick={onBack}>
          लॉगिन पर वापस जाएँ
        </button>
      </p>
    </form>
  );
}
