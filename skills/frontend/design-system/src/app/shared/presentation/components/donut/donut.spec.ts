import { TestBed } from '@angular/core/testing';
import { Donut } from './donut';

describe('Donut', () => {
  function render(inputs: Record<string, unknown>) {
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

  it('leaves the ring empty, with no centre text, when nothing is measured', () => {
    const el = render({ value: null, text: '', ariaLabel: 'x' });
    expect(el.querySelectorAll('circle').length).toBe(1);
    expect(el.textContent!.trim()).toBe('');
  });

  it('grows the centre text in the large variant', () => {
    const el = render({ value: 50, text: '50 %', size: 152, large: true, ariaLabel: 'x' });
    expect(el.querySelector('span')!.className).toContain('text-3xl');
    expect(el.style.width).toBe('152px');
  });
});
