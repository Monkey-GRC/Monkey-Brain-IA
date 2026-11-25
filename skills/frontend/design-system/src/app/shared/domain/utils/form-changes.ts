/**
 * Whether a form holds something the person wrote and has not sent: its current value differs from the value it started with (MD-485).
 * It is not `dirty` nor `touched`: typing and erasing back to the start is «no changes», and a field only focused is too.
 * Text is compared trimmed; `''`, `null` and `undefined` are the same «empty»; arrays keep their order; objects compare key by key.
 * A view passes the result to `guarded` of `app-form-modal` or `app-detail-modal`, which then asks before discarding it.
 *
 *   readonly guarded = computed(() => hasChanges(this.initial, this.values()));
 */
export function hasChanges(initial: unknown, current: unknown): boolean {
  return !same(normalize(initial), normalize(current));
}

function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() === '' ? null : value.trim();
  if (Array.isArray(value)) return value.map(normalize);
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) out[key] = normalize(v);
    return out;
  }
  return value;
}

function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const keys = new Set([...Object.keys(ra), ...Object.keys(rb)]);
  for (const key of keys) if (!same(ra[key] ?? null, rb[key] ?? null)) return false;
  return true;
}
