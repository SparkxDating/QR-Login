import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { CAMP } from "@/lib/camp";
import { adminLogin } from "@/lib/registrations.functions";
import { AdminPasswordRecoverForm } from "@/components/admin-password";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLogin({
  configured,
  onSuccess,
  onRecovered,
}: {
  configured: boolean;
  onSuccess: () => void;
  onRecovered?: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recover, setRecover] = useState(false);

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
      onSuccess();
    } catch {
      setError("लॉगिन नहीं हो सका।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh bg-cream px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <p className="text-sm font-semibold text-saffron">{CAMP.foundation}</p>
          {recover ? (
            <AdminPasswordRecoverForm
              onBack={() => setRecover(false)}
              onRecovered={onRecovered}
            />
          ) : (
            <form onSubmit={submit}>
              <h1 className="mt-2 font-display text-2xl text-navy">प्रशासन लॉगिन</h1>
              <p className="mt-1 text-sm text-muted">केवल अधिकृत कार्यकर्ताओं के लिए</p>
              <p className="mt-2 text-sm font-medium text-saffron">{CAMP.dateLine}</p>
              <Label className="mt-5 mb-1.5">पासवर्ड</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {!configured ? (
                <p className="mt-2 text-xs text-danger">
                  ADMIN_PASSWORD पर्यावरण चर सेट नहीं है। लॉगिन अक्षम है।
                </p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="mt-5 w-full" disabled={busy || !configured}>
                {busy ? "जाँच हो रही है…" : "प्रवेश करें"}
              </Button>
              <p className="mt-4 text-center text-sm">
                <button
                  type="button"
                  className="text-maroon hover:underline"
                  onClick={() => setRecover(true)}
                >
                  पासवर्ड भूल गए?
                </button>
                <span className="mt-1 block text-xs text-muted">Forgot Admin Password?</span>
              </p>
              <p className="mt-3 text-center text-sm">
                <Link to="/register" className="text-maroon hover:underline">
                  पंजीकरण पृष्ठ पर जाएँ
                </Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
