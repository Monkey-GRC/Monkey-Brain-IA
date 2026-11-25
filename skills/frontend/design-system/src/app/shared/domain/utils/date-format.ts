export type DateStyle = 'short' | 'medium' | 'long' | 'full';

export interface DateFormatOptions {
  /** `Intl` `dateStyle`; `medium` by default («24 nov 2026» / «Nov 24, 2026»). */
  style?: DateStyle;
  /** Adds the time (`timeStyle: 'short'`). */
  time?: boolean;
  /**
   * A calendar day (`AAAA-MM-DD` from the backend: a period, a window, an expiry): read and shown in UTC, so the time zone never moves it a day.
   * Without it the value is an instant (`submitted_at`, `created_at`) and is shown in the local time zone.
   */
  calendar?: boolean;
}

export type DateInput = string | number | Date | null | undefined;

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const formatters = new Map<string, Intl.DateTimeFormat>();

/** One `Intl.DateTimeFormat` per language and options, built once (building one is far slower than formatting with it). */
function formatter(language: string, style: DateStyle, time: boolean, calendar: boolean): Intl.DateTimeFormat {
  const key = `${language}|${style}|${time ? 't' : ''}|${calendar ? 'utc' : ''}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(language, { dateStyle: style, ...(time ? { timeStyle: 'short' } : {}), ...(calendar ? { timeZone: 'UTC' } : {}) });
    formatters.set(key, f);
  }
  return f;
}

/**
 * A date from the backend in the language of the session (`LanguageService.current()`): the formatter of every date a view shows (and the one inside `LocalDatePipe`).
 * Not for what needs other parts of a date on purpose: the month and weekday names of `date-picker` (Platform) and the time alone of `agent-install-panel`.
 * Returns `''` for an empty or unreadable value, so the caller picks its own fallback (`|| '—'`, `|| iso`).
 *
 *   formatLocalDate(row.submitted_at, this.language.current())                          // an instant: «24 nov 2026»
 *   formatLocalDate(period.end, this.language.current(), { calendar: true, style: 'long' }) // a day: «24 de noviembre de 2026», never the 23rd
 *
 * Inside a `computed` it reacts to the language because `language.current()` is read there.
 */
export function formatLocalDate(value: DateInput, language: string, options: DateFormatOptions = {}): string {
  if (value === null || value === undefined || value === '') return '';
  const calendar = options.calendar ?? false;
  const date = value instanceof Date ? value : new Date(typeof value === 'string' && calendar && DAY_ONLY.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return '';
  return formatter(language, options.style ?? 'medium', options.time ?? false, calendar).format(date);
}
