import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const passwordFields = z.object({
  newPassword: z.string().min(1, "नया पासवर्ड आवश्यक है").max(200),
  confirmPassword: z.string().min(1, "पासवर्ड पुष्टि आवश्यक है").max(200),
});

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator(
    passwordFields.extend({
      currentPassword: z.string().min(1, "वर्तमान पासवर्ड आवश्यक है").max(200),
    }),
  )
  .handler(async ({ data }) => {
    const { assertSameOriginWrite, clientKey, requireAdmin, changeAdminPassword: change } =
      await import("./admin-session.server");
    const { allowRequest } = await import("./rate-limit.server");
    const { setResponseStatus } = await import("@tanstack/react-start/server");

    assertSameOriginWrite();
    await requireAdmin();
    if (!allowRequest(clientKey("admin-password-change"), 5, 15 * 60 * 1000)) {
      setResponseStatus(429);
      return { ok: false as const, error: "बहुत अधिक प्रयास। कुछ देर बाद कोशिश करें।" };
    }
    if (data.newPassword !== data.confirmPassword) {
      return { ok: false as const, error: "नया पासवर्ड मेल नहीं खाता।" };
    }
    const result = await change(data.currentPassword, data.newPassword);
    if (result === "invalid") return { ok: false as const, error: "वर्तमान पासवर्ड गलत है।" };
    if (result === "same") {
      return { ok: false as const, error: "नया पासवर्ड पुराने से अलग होना चाहिए।" };
    }
    if (result === "weak") {
      return { ok: false as const, error: "नया पासवर्ड कम से कम 8 अक्षर का होना चाहिए।" };
    }
    if (result !== "ok") {
      return { ok: false as const, error: "पासवर्ड नहीं बदला जा सका। पुनः प्रयास करें।" };
    }
    return { ok: true as const };
  });

export const recoverAdminPassword = createServerFn({ method: "POST" })
  .validator(
    passwordFields.extend({
      recoveryCode: z.string().min(1, "रिकवरी कोड आवश्यक है").max(200),
    }),
  )
  .handler(async ({ data }) => {
    const { assertSameOriginWrite, clientKey, recoverAdminPassword: recover } = await import(
      "./admin-session.server"
    );
    const { allowRequest } = await import("./rate-limit.server");
    const { setResponseStatus } = await import("@tanstack/react-start/server");

    assertSameOriginWrite();
    if (!allowRequest(clientKey("admin-password-recover"), 5, 15 * 60 * 1000)) {
      setResponseStatus(429);
      return { ok: false as const, error: "बहुत अधिक प्रयास। कुछ देर बाद कोशिश करें।" };
    }
    if (data.newPassword !== data.confirmPassword) {
      return { ok: false as const, error: "नया पासवर्ड मेल नहीं खाता।" };
    }
    const result = await recover(data.recoveryCode, data.newPassword);
    if (result === "weak") {
      return { ok: false as const, error: "नया पासवर्ड कम से कम 8 अक्षर का होना चाहिए।" };
    }
    if (result === "invalid") return { ok: false as const, error: "रिकवरी कोड गलत है।" };
    if (result !== "ok") {
      return { ok: false as const, error: "पासवर्ड नहीं बदला जा सका। पुनः प्रयास करें।" };
    }
    return { ok: true as const };
  });
