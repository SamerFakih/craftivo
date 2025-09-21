// Reusable date parsing & range helpers
// Centralizes defensive parsing to avoid scattering new Date() calls.

export function parseDate(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

export function parseDateStrict(value?: string | null): Date | undefined {
  if (!value) return undefined;
  // Enforce YYYY-MM-DD basic format before constructing
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const d = new Date(value + 'T00:00:00Z');
  return isNaN(d.getTime()) ? undefined : d;
}

export function dateRangeFromStrings(
  start?: string,
  end?: string,
): { gte?: Date; lte?: Date } | undefined {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s && !e) return undefined;
  return {
    ...(s && { gte: s }),
    ...(e && { lte: e }),
  };
}

export function toISODate(d?: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : '';
}
