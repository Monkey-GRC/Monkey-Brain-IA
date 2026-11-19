import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MetricCard } from './metric-card';

describe('MetricCard', () => {
  let fixture: ComponentFixture<MetricCard>;
  const el = () => fixture.nativeElement as HTMLElement;

  const setup = (inputs: Record<string, unknown>) => {
    fixture = TestBed.createComponent(MetricCard);
    Object.entries(inputs).forEach(([k, v]) => fixture.componentRef.setInput(k, v));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [MetricCard] }));

  it('draws the icon in a circle of its colour, then label, figure and description', () => {
    setup({ icon: 'apartment', color: 'data-3', label: 'Empresas', value: 12, description: 'Nuevas' });
    const circle = el().querySelector('.mk-metric-icon')!;
    expect(circle.className).toContain('mk-metric-icon-data-3');
    expect(circle.getAttribute('aria-hidden')).toBe('true');
    expect(circle.textContent!.trim()).toBe('apartment');
    expect(el().querySelector('[data-metric-label]')!.textContent).toBe('Empresas');
    expect(el().querySelector('[data-metric-value]')!.className).toContain('tabular-nums');
    expect(el().querySelector('[data-metric-value]')!.textContent).toBe('12');
    expect(el().querySelector('[data-metric-description]')!.textContent).toBe('Nuevas');
  });

  it('uses a status colour for a status metric and has no description line when there is none', () => {
    setup({ icon: 'key_off', color: 'bad', label: 'Vencidas', value: 3 });
    expect(el().querySelector('.mk-metric-icon')!.className).toContain('mk-metric-icon-bad');
    expect(el().querySelector('[data-metric-description]')).toBeNull();
  });

  it('is a plain card: line border, no shadow, no gradient', () => {
    setup({ icon: 'dns', color: 'data-1', label: 'A', value: 1 });
    const cls = el().className;
    expect(cls).toContain('border-line');
    expect(cls).not.toMatch(/shadow|gradient|featured/);
  });
});
