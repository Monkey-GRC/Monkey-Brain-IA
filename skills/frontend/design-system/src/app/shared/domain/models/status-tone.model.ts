/** The four tones of a status (colour never travels alone: a label goes next to it). Lives in `shared/domain` so a feature's domain code can use it without importing a component. */
export type StatusTone = 'ok' | 'bad' | 'warn' | 'neutral';
