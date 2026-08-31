import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { BLOCKS, CAMP } from "@/lib/camp";
import { registrationInputSchema } from "@/lib/registrations";
import { submitRegistration } from "@/lib/registrations.functions";
import { Button } from "@/components/ui/button";
import { FieldError, Label } from "@/components/ui/label";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { SuccessView } from "@/components/success-view";
import { LoaderCircle } from "lucide-react";

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
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>( {} );
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{
    number: string;
    details: Record<string, string>;
  } | null>(null);
  const lock = useRef(false);

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
          "\u0928\u093e\u092e": parsed.data.name,
          "\u092a\u093f\u0924\u093e/\u092a\u0924\u093f \u0915\u093e \u0928\u093e\u092e": parsed.data.fatherOrHusbandName,
          "\u0917\u094d\u0930\u093e\u092e": parsed.data.village,
          "\u092a\u094b\u0938\u094d\u091f": parsed.data.post,
          "\u0928\u094d\u092f\u093e\u092f \u092a\u0902\u091a\u093e\u092f\u0924": parsed.data.nyayaPanchayat,
          "\u092c\u094d\u0932\u0949\u0915": parsed.data.block,
          "\u0924\u0939\u0938\u0940\u0932": parsed.data.tehsil,
          "\u091c\u0928\u092a\u0926": parsed.data.district,
          "\u092e\u094b\u092c\u093e\u0907\u0932": parsed.data.mobile,
        },
      });
      setValues(EMPTY);
      setErrors({});
    } catch {
      setFormError("\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0928\u0939\u0940\u0902 \u0939\u094b \u0938\u0915\u093e\u0964 \u0915\u0943\u092a\u092f\u093e \u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0902\u0964");
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <SuccessView
        registrationNumber={success.number}
        details={success.details}
        onReset={() => setSuccess(null)}
      />
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-xl bg-paper p-5 shadow-[var(--shadow-card)] sm:p-6"
    >
      <h2 className="font-display text-2xl text-maroon">\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0939\u0947\u0924\u0941 \u0935\u093f\u0935\u0930\u0923</h2>
      <p className="mt-1 text-sm text-muted">\u0924\u093e\u0930\u093e\u0902\u0915\u0928 (*) \u0935\u093e\u0932\u0947 \u0938\u092d\u0940 \u0915\u0949\u0932\u092e \u0905\u0928\u093f\u0935\u093e\u0930\u094d\u092f \u0939\u0948\u0902\u0964</p>

      <div className="mt-5 grid gap-4">
        <Field label="\u0928\u093e\u092e *" error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={120}
          />
        </Field>
        <Field label="\u092a\u093f\u0924\u093e/\u092a\u0924\u093f \u0915\u093e \u0928\u093e\u092e *" error={errors.fatherOrHusbandName}>
          <Input
            id="fatherOrHusbandName"
            name="fatherOrHusbandName"
            value={values.fatherOrHusbandName}
            onChange={(e) => set("fatherOrHusbandName", e.target.value)}
            maxLength={120}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="\u0917\u094d\u0930\u093e\u092e *" error={errors.village}>
            <Input
              id="village"
              name="village"
              value={values.village}
              onChange={(e) => set("village", e.target.value)}
              maxLength={120}
            />
          </Field>
          <Field label="\u092a\u094b\u0938\u094d\u091f *" error={errors.post}>
            <Input
              id="post"
              name="post"
              value={values.post}
              onChange={(e) => set("post", e.target.value)}
              maxLength={120}
            />
          </Field>
        </div>
        <Field label="\u0928\u094d\u092f\u093e\u092f \u092a\u0902\u091a\u093e\u092f\u0924 *" error={errors.nyayaPanchayat}>
          <Input
            id="nyayaPanchayat"
            name="nyayaPanchayat"
            value={values.nyayaPanchayat}
            onChange={(e) => set("nyayaPanchayat", e.target.value)}
            maxLength={120}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="\u092c\u094d\u0932\u0949\u0915 *" error={errors.block}>
            <NativeSelect
              id="block"
              name="block"
              value={values.block}
              onChange={(e) =>
                set("block", e.target.value as (typeof BLOCKS)[number] | "")
              }
            >
              <option value="">\u092c\u094d\u0932\u0949\u0915 \u091a\u0941\u0928\u0947\u0902</option>
              {BLOCKS.map((block) => (
                <option key={block} value={block}>
                  {block}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="\u0924\u0939\u0938\u0940\u0932 *" error={errors.tehsil}>
            <Input
              id="tehsil"
              name="tehsil"
              value={values.tehsil}
              onChange={(e) => set("tehsil", e.target.value)}
              maxLength={120}
            />
          </Field>
        </div>
        <Field label="\u091c\u0928\u092a\u0926 *" error={errors.district}>
          <Input
            id="district"
            name="district"
            value={values.district}
            onChange={(e) => set("district", e.target.value)}
            maxLength={120}
          />
        </Field>
        <Field label="\u0938\u0902\u092a\u0930\u094d\u0915 \u0938\u0942\u0924\u094d\u0930 / \u092e\u094b\u092c\u093e\u0907\u0932 \u0928\u0902\u092c\u0930 *" error={errors.mobile}>
          <Input
            id="mobile"
            name="mobile"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={10}
            value={values.mobile}
            onChange={(e) => set("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10 \u0905\u0902\u0915\u094b\u0902 \u0915\u093e \u092e\u094b\u092c\u093e\u0907\u0932 \u0928\u0902\u092c\u0930"
          />
        </Field>
        <Field label="\u0928\u094b\u091f" error={errors.note}>
          <Textarea
            name="note"
            value={values.note}
            onChange={(e) => set("note", e.target.value)}
            maxLength={500}
            placeholder="\u0915\u094b\u0908 \u0905\u0924\u093f\u0930\u093f\u0915\u094d\u0924 \u091c\u093e\u0928\u0915\u093e\u0930\u0940 (\u0935\u0948\u0915\u0932\u094d\u092a\u093f\u0915)"
          />
        </Field>

        <div className="hidden" aria-hidden="true">
          <label>
            \u0935\u0947\u092c\u0938\u093e\u0907\u091f
            <input
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </label>
        </div>

        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-md bg-cream px-3 py-3">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-saffron"
            checked={values.confirmed}
            onChange={(e) => set("confirmed", e.target.checked)}
          />
          <span className="text-sm leading-snug text-navy">
            \u092e\u0948\u0902\u0928\u0947 \u0909\u092a\u0930 \u0926\u0940 \u0917\u0908 \u091c\u093e\u0928\u0915\u093e\u0930\u0940 \u0938\u0939\u0940 \u0926\u0930\u094d\u091c \u0915\u0940 \u0939\u0948\u0964
          </span>
        </label>
        <FieldError>{errors.confirmed}</FieldError>
      </div>

      {formError ? (
        <p className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
        {submitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0939\u094b \u0930\u0939\u093e \u0939\u0948\u2026
          </>
        ) : (
          "\u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u0930\u0947\u0902"
        )}
      </Button>
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
