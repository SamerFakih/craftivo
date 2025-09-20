import { Transform } from 'class-transformer';

/** Generic optional number transformer: converts numeric-like values or returns undefined */
export const OptionalNumber = () =>
  Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  });

/** Optional trimmed string; returns undefined if empty after trim */
export const OptionalTrimmedString = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const s = value.trim();
    return s.length ? s : undefined;
  });

/** Lowercases string enum inputs; returns undefined for non-string */
export const OptionalLowercasedEnum = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const s = value.trim();
    return s ? s.toLowerCase() : undefined;
  });

/** Coerces common boolean string representations */
export const OptionalBoolean = () =>
  Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.toLowerCase();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    // Fallback: not coercible -> undefined for safety
    return undefined;
  });

/** Pass-through for ISO date strings, trimming and validating non-empty */
export const OptionalISODateString = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return undefined;
    const s = value.trim();
    return s.length ? s : undefined;
  });
