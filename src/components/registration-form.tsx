import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { BLOCKS, CAMP } from "@/lib/camp";
import { registrationInputSchema } from "@/lib/registrations";
import { submitRegistration } from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/label";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { SuccessView } from "@/components/success-view";
import { LoaderCircle, PenLine } from "lucide-react";

type FieldKey =
  | "name"
  | "fatherOrHusbandName"
  | "village"
  | "post"
  | "nyayaPanchayat"
  | "block"
  | "tehsil"
  | "district"
  | "mobile"
  | "note"
  | "confirmed";

type FormState = {
  name: string;
  fatherOrHusbandName: string;
  village: string;
  post: string;
  nyayaPanchayat: string;
  block: "" | (typeof BLOCKS)[number];
  tehsil: string;
  district: string;
  mobile: string;
  note: string;
  confirmed: boolean;
  website: string;
};

const EMPTY: FormState = {
  name: "",
  fatherOrHusbandName: "",
  village: "",
  post: "",
  nyayaPanchayat: "",
  block: "",
  tehsil: "",
  district: CAMP.districtDefault,
  mobile: "",
  note: "",
  confirmed: false,
  website: "",
};

export function RegistrationForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    number: string;
    details: Record<string, string>;
  } | null>(null);
  const lock = useRef(false);
  const successRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!success) return;
    const node = successRef.current;
    if (!node) return;

    const pin = () => {
      node.focus({ preventScroll: true });
      node.scrollIntoView({ behavior: "auto", block: "start" });
      const y = node.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo(0, Math.max(0, y));
      const shell = document.querySelector(".poster-shell");
      if (shell instanceof HTMLElement) {
        const top =
          node.getBoundingClientRect().top -
          shell.getBoundingClientRect().top +
          shell.scrollTop -
          8;
        shell.scrollTo(0, Math.max(0, top));
      }
    };

    pin();
    const frame = requestAnimationFrame(pin);
    const later = window.setTimeout(pin, 80);
    const settle = window.setTimeout(pin, 240);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(later);
      window.clearTimeout(settle);
    };
  }, [success]);

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || submitting) return;
    setFormError("");

    const parsed = registrationInputSchema.safeParse({
      ...values,
      block: values.block || undefined,
    });
    if (!parsed.success) {
      const next: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in next)) {
          next[key as FieldKey] = issue.message;
        }
      }
      setErrors(next);
      return;
    }

    lock.current = true;
    setSubmitting(true);
    try {
      const result = await submitRegistration({ data: parsed.data });
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setSuccess({
        number: result.registrationNumber,
        details: {
          नाम: parsed.data.name,
          "पिता/पति का नाम": parsed.data.fatherOrHusbandName,
          ग्राम: parsed.data.village,
          पोस्ट: parsed.data.post,
          "न्याय पंचायत": parsed.data.nyayaPanchayat,
          ब्लॉक: parsed.data.block,
          तहसील: parsed.data.tehsil,
          जनपद: parsed.data.district,
          मोबाइल: parsed.data.mobile,
        },
      });
      setValues(EMPTY);
      setErrors({});
    } catch {
      setFormError("पंजीकरण नहीं हो सका। कृपया पुनः प्रयास करें।");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        ref={successRef}
        id="registration-success"
        tabIndex={-1}
        className="outline-none"
      >
        <SuccessView
          registrationNumber={success.number}
          details={success.details}
          onReset={() => setSuccess(null)}
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="overflow-hidden rounded-xl bg-paper shadow-[var(--shadow-card)]"
    >
      <h2 className="banner-maroon px-5 py-3 font-display text-xl sm:text-2xl">
        {CAMP.formHeading}
      </h2>
      <div className="p-5 sm:p-6">
        <p className="text-sm text-muted">तारांकन (*) वाले सभी कॉलम अनिवार्य हैं।</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="grid content-start gap-4">
            <Field label="1. नाम *" error={errors.name}>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={120}
                placeholder="अपना पूरा नाम दर्ज करें"
              />
            </Field>
            <Field label="2. पिता/पति का नाम *" error={errors.fatherOrHusbandName}>
              <Input
                id="fatherOrHusbandName"
                name="fatherOrHusbandName"
                value={values.fatherOrHusbandName}
                onChange={(e) => set("fatherOrHusbandName", e.target.value)}
                maxLength={120}
                placeholder="पिता/पति का नाम दर्ज करें"
              />
            </Field>
            <Field label="3. ग्राम *" error={errors.village}>
              <Input
                id="village"
                name="village"
                value={values.village}
                onChange={(e) => set("village", e.target.value)}
                maxLength={120}
                placeholder="ग्राम का नाम दर्ज करें"
              />
            </Field>
            <Field label="4. पोस्ट *" error={errors.post}>
              <Input
                id="post"
                name="post"
                value={values.post}
                onChange={(e) => set("post", e.target.value)}
                maxLength={120}
                placeholder="पोस्ट का नाम दर्ज करें"
              />
            </Field>
            <Field label="5. न्याय पंचायत *" error={errors.nyayaPanchayat}>
              <Input
                id="nyayaPanchayat"
                name="nyayaPanchayat"
                value={values.nyayaPanchayat}
                onChange={(e) => set("nyayaPanchayat", e.target.value)}
                maxLength={120}
                placeholder="न्याय पंचायत का नाम दर्ज करें"
              />
            </Field>
          </div>
          <div className="grid content-start gap-4">
            <Field label="6. ब्लॉक *" error={errors.block}>
              <NativeSelect
                id="block"
                name="block"
                value={values.block}
                onChange={(e) =>
                  set("block", e.target.value as (typeof BLOCKS)[number] | "")
                }
              >
                <option value="">चयन करें</option>
                {BLOCKS.map((block) => (
                  <option key={block} value={block}>
                    {block}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="7. तहसील *" error={errors.tehsil}>
              <Input
                id="tehsil"
                name="tehsil"
                value={values.tehsil}
                onChange={(e) => set("tehsil", e.target.value)}
                maxLength={120}
                placeholder="तहसील का नाम दर्ज करें"
              />
            </Field>
            <Field label="8. जनपद *" error={errors.district}>
              <Input
                id="district"
                name="district"
                value={values.district}
                onChange={(e) => set("district", e.target.value)}
                maxLength={120}
              />
            </Field>
            <Field label="9. संपर्क सूत्र / मोबाइल नंबर *" error={errors.mobile}>
              <Input
                id="mobile"
                name="mobile"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                value={values.mobile}
                onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10 अंक का मोबाइल नंबर दर्ज करें"
              />
            </Field>
            <Field label="10. नोट (वैकल्पिक)" error={errors.note}>
              <Textarea
                name="note"
                value={values.note}
                onChange={(e) => set("note", e.target.value)}
                maxLength={500}
                placeholder="यदि कोई विशेष जानकारी हो तो लिखें"
                className="min-h-12 sm:min-h-28"
              />
            </Field>
          </div>
        </div>

        <div className="hidden" aria-hidden="true">
          <label>
            वेबसाइट
            <input
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </label>
        </div>

        <label className="mt-5 flex min-h-12 cursor-pointer items-start gap-3 rounded-md bg-cream px-3 py-3">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-saffron"
            checked={values.confirmed}
            onChange={(e) => set("confirmed", e.target.checked)}
          />
          <span className="text-sm leading-snug text-navy">
            मैंने ऊपर दी गई जानकारी सही दर्ज की है।
          </span>
        </label>
        <FieldError>{errors.confirmed}</FieldError>

        {formError ? (
          <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
          {submitting ? (
            <>
              <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              पंजीकरण हो रहा है...
            </>
          ) : (
            <>
              <PenLine className="size-5" aria-hidden="true" />
              पंजीकरण करें
            </>
          )}
        </Button>
        <p className="mt-4 text-center text-xs leading-relaxed text-muted">{CAMP.privacyNote}</p>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5">{label}</Label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
