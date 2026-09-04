import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const pingVisit = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(8).max(80),
      kind: z.enum(["view", "beat"]),
    }),
  )
  .handler(async ({ data }) => {
    const { assertSameOriginWrite, clientKey } = await import("./admin-session.server");
    const { allowRequest } = await import("./rate-limit.server");
    const { recordVisit } = await import("./visits.server");

    assertSameOriginWrite();
    if (!allowRequest(clientKey("visit-ping"), 40, 15 * 60 * 1000)) {
      return { ok: true as const };
    }
    try {
      await recordVisit(data.token, data.kind);
    } catch {
      // Tracking must never affect the public page.
    }
    return { ok: true as const };
  });

export const getVisitStats = createServerFn({ method: "POST" }).handler(async () => {
  const { requireAdmin } = await import("./admin-session.server");
  const { loadVisitStats } = await import("./visits.server");
  const session = await requireAdmin();
  const detailed = session.role === "super_admin";
  const stats = await loadVisitStats(detailed ? 30 : 14);
  if (!detailed) {
    return {
      ...stats,
      daily: [] as typeof stats.daily,
      detailed: false as const,
    };
  }
  return { ...stats, detailed: true as const };
});
