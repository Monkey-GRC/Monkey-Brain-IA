import { TestBed } from '@angular/core/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { Donut } from './donut';

describe('Donut', () => {
  function render(inputs: Record<string, unknown>) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Donut);
    for (const [k, v] of Object.entries(inputs)) fixture.componentRef.setInput(k, v);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the value with a data-palette colour and exposes it as aria-label and as text', () => {
    const el = render({ value: 25, text: '25 %', color: 3, ariaLabel: 'SOC 2: 25 %' });
    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('SOC 2: 25 %');
    expect(el.textContent).toContain('25 %');
    const arc = el.querySelectorAll('circle')[1];
    expect(arc.getAttribute('stroke')).toBe('var(--color-data-3)');
    const [filled] = arc.getAttribute('stroke-dasharray')!.split(' ').map(Number);
    expect(filled).toBeCloseTo(2 * Math.PI * 44 * 0.25, 3);
  });

  it('takes a status token instead of the data palette when it has a tone', () => {
    const el = render({ value: 40, text: '40 %', color: 3, tone: 'bad', ariaLabel: 'x' });
    expect(el.querySelectorAll('circle')[1].getAttribute('stroke')).toBe('var(--color-bad)');
  });

  it('leaves the ring empty and shows «—» in the centre when nothing is measured (never a 0 %, never a mute ring)', () => {
    const el = render({ value: null, text: '0 %', ariaLabel: 'SOC 2: Sin medir' });
    expect(el.querySelectorAll('circle').length).toBe(1);
    expect(el.querySelector('[data-donut-empty]')!.textContent!.trim()).toBe('—');
    expect(el.textContent).not.toContain('0 %');
    expect(el.getAttribute('aria-label')).toBe('SOC 2: Sin medir');
  });

  it('reads «Sin medir» when nothing is measured and the caller gave no label', () => {
    const el = render({ value: null });
    expect(el.getAttribute('aria-label')).toBe('COMMON.READINESS.LABEL.NOT_MEASURED');
  });

  it('follows a change of language in the «Sin medir» label', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', { COMMON: { READINESS: { LABEL: { NOT_MEASURED: 'Sin medir' } } } });
    translate.setTranslation('en', { COMMON: { READINESS: { LABEL: { NOT_MEASURED: 'Not measured' } } } });
    translate.use('es');
    const fixture = TestBed.createComponent(Donut);
    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Sin medir');
    translate.use('en');
    fixture.detectChanges();
    expect(el.getAttribute('aria-label')).toBe('Not measured');
  });

  it('grows the centre text in the large variant', () => {
    const el = render({ value: 50, text: '50 %', size: 152, large: true, ariaLabel: 'x' });
    expect(el.querySelector('span')!.className).toContain('text-3xl');
    expect(el.style.width).toBe('152px');
  });
});
