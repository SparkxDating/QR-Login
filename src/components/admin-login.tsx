import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import type { AdminRole } from "@/lib/admin";
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
  onSuccess: (role: AdminRole) => void;
  onRecovered?: () => void;
}) {
  const [superMode, setSuperMode] = useState(false);
  const [username, setUsername] = useState("");
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
      const res = await adminLogin({
        data: {
          username: superMode ? username.trim() : "",
          password,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      onSuccess(res.role);
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
              <h1 className="mt-2 font-display text-2xl text-navy">
                {superMode ? "Super Admin Login" : "प्रशासन लॉगिन"}
              </h1>
              <p className="mt-1 text-sm text-muted">केवल अधिकृत कार्यकर्ताओं के लिए</p>
              <p className="mt-2 text-sm font-medium text-saffron">{CAMP.dateLine}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={superMode ? "secondary" : "navy"}
                  onClick={() => {
                    setSuperMode(false);
                    setError("");
                  }}
                >
                  Admin
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={superMode ? "navy" : "secondary"}
                  onClick={() => {
                    setSuperMode(true);
                    setError("");
                  }}
                >
                  Super Admin Login
                </Button>
              </div>
              {superMode ? (
                <>
                  <Label className="mt-5 mb-1.5" htmlFor="admin-username">
                    Super Admin उपयोगकर्ता नाम
                  </Label>
                  <Input
                    id="admin-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </>
              ) : null}
              <Label className={superMode ? "mt-4 mb-1.5" : "mt-5 mb-1.5"} htmlFor="admin-password">
                पासवर्ड
              </Label>
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
                  प्रशासन लॉगिन कॉन्फ़िगर नहीं है।
                </p>
              ) : null}
              {error ? (
                <p className="mt-3 text-sm text-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="mt-5 w-full" disabled={busy || !configured}>
                {busy ? "जाँच हो रही है…" : superMode ? "Super Admin प्रवेश" : "प्रवेश करें"}
              </Button>
              {!superMode ? (
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
              ) : null}
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
