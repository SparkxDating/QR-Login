const buckets = new Map<string, number[]>();

export function allowRequest(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const kept = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (kept.length >= max) {
    buckets.set(key, kept);
    return false;
  }
  kept.push(now);
  buckets.set(key, kept);
  if (buckets.size > 4000) {
    for (const [k, times] of buckets) {
      if (times.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}
