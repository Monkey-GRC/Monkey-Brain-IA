/** The tones of a status (colour never travels alone: a label goes next to it): the four states, `info` (brand tint) and the risk scale (`risk-*` keeps its own tokens). Lives in `shared/domain` so a feature's domain code can use it without importing a component. */
export type StatusTone = 'ok' | 'bad' | 'warn' | 'neutral' | 'info' | 'risk-low' | 'risk-moderate' | 'risk-high' | 'risk-critical';
