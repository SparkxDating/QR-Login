import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const passwordFields = z.object({
  newPassword: z.string().min(1).max(200),
  confirmPassword: z.string().min(1).max(200),
});

export const changeAdminPassword = createServerFn({ method: "POST" })
  .validator(
    passwordFields.extend({
      currentPassword: z.string().min(1).max(200),
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
      return { ok: false as const, error: "\u092c\u0939\u0941\u0924 \u0905\u0927\u093f\u0915 \u092a\u094d\u0930\u092f\u093e\u0938\u0964 \u0915\u0941\u091b \u0926\u0947\u0930 \u092c\u093e\u0926 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964" };
    }
    if (data.newPassword !== data.confirmPassword) {
      return { ok: false as const, error: "\u0928\u092f\u093e \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092e\u0947\u0932 \u0928\u0939\u0940\u0902 \u0916\u093e\u0924\u093e\u0964" };
    }
    const result = await change(data.currentPassword, data.newPassword);
    if (result === "invalid") return { ok: false as const, error: "\u0935\u0930\u094d\u0924\u092e\u093e\u0928 \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0917\u0932\u0924 \u0939\u0948\u0964" };
    if (result === "same") {
      return { ok: false as const, error: "\u0928\u092f\u093e \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092a\u0941\u0930\u093e\u0928\u0947 \u0938\u0947 \u0905\u0932\u0917 \u0939\u094b\u0928\u093e \u091a\u093e\u0939\u093f\u090f\u0964" };
    }
    if (result === "weak") {
      return { ok: false as const, error: "\u0928\u092f\u093e \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0915\u092e \u0938\u0947 \u0915\u092e 8 \u0905\u0915\u094d\u0937\u0930 \u0915\u093e \u0939\u094b\u0928\u093e \u091a\u093e\u0939\u093f\u090f\u0964" };
    }
    if (result !== "ok") {
      return { ok: false as const, error: "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0928\u0939\u0940\u0902 \u092c\u0926\u0932\u093e \u091c\u093e \u0938\u0915\u093e\u0964 \u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0902\u0964" };
    }
    return { ok: true as const };
  });

export const recoverAdminPassword = createServerFn({ method: "POST" })
  .validator(
    passwordFields.extend({
      recoveryCode: z.string().min(1).max(200),
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
      return { ok: false as const, error: "\u092c\u0939\u0941\u0924 \u0905\u0927\u093f\u0915 \u092a\u094d\u0930\u092f\u093e\u0938\u0964 \u0915\u0941\u091b \u0926\u0947\u0930 \u092c\u093e\u0926 \u0915\u094b\u0936\u093f\u0936 \u0915\u0930\u0947\u0902\u0964" };
    }
    if (data.newPassword !== data.confirmPassword) {
      return { ok: false as const, error: "\u0928\u092f\u093e \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u092e\u0947\u0932 \u0928\u0939\u0940\u0902 \u0916\u093e\u0924\u093e\u0964" };
    }
    const result = await recover(data.recoveryCode, data.newPassword);
    if (result === "weak") {
      return { ok: false as const, error: "\u0928\u092f\u093e \u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0915\u092e \u0938\u0947 \u0915\u092e 8 \u0905\u0915\u094d\u0937\u0930 \u0915\u093e \u0939\u094b\u0928\u093e \u091a\u093e\u0939\u093f\u090f\u0964" };
    }
    if (result === "invalid") return { ok: false as const, error: "\u0930\u093f\u0915\u0935\u0930\u0940 \u0915\u094b\u0921 \u0917\u0932\u0924 \u0939\u0948\u0964" };
    if (result !== "ok") {
      return { ok: false as const, error: "\u092a\u093e\u0938\u0935\u0930\u094d\u0921 \u0928\u0939\u0940\u0902 \u092c\u0926\u0932\u093e \u091c\u093e \u0938\u0915\u093e\u0964 \u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0902\u0964" };
    }
    return { ok: true as const };
  });
