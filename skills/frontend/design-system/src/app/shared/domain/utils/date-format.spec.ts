import { formatLocalDate } from './date-format';

describe('formatLocalDate', () => {
  it('a calendar day keeps its day in any time zone (read and shown in UTC)', () => {
    const utc = new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date('2026-03-01T00:00:00Z'));
    expect(formatLocalDate('2026-03-01', 'es', { calendar: true })).toBe(utc);
  });

  it('follows the language and the style', () => {
    const day = new Date('2026-11-24T00:00:00Z');
    expect(formatLocalDate('2026-11-24', 'en', { calendar: true, style: 'long' })).toBe(new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' }).format(day));
    expect(formatLocalDate('2026-11-24', 'es', { calendar: true, style: 'long' })).toBe(new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' }).format(day));
  });

  it('an instant is shown in the local time zone, with the time when asked', () => {
    const iso = '2026-11-24T15:30:00Z';
    expect(formatLocalDate(iso, 'en')).toBe(new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(iso)));
    expect(formatLocalDate(iso, 'en', { time: true })).toBe(new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)));
  });

  it('a full timestamp passed as a calendar day is still read (no Invalid Date)', () => {
    expect(formatLocalDate('2026-11-24T00:00:00Z', 'en', { calendar: true })).toBe(new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date('2026-11-24T00:00:00Z')));
  });

  it('accepts a Date and a number', () => {
    const d = new Date('2026-01-02T00:00:00Z');
    expect(formatLocalDate(d, 'en', { calendar: true })).toBe(formatLocalDate(d.getTime(), 'en', { calendar: true }));
  });

  it('empty or unreadable values give an empty text, for the caller to pick its fallback', () => {
    expect(formatLocalDate(null, 'es')).toBe('');
    expect(formatLocalDate(undefined, 'es')).toBe('');
    expect(formatLocalDate('', 'es')).toBe('');
    expect(formatLocalDate('not a date', 'es', { calendar: true })).toBe('');
  });
});
