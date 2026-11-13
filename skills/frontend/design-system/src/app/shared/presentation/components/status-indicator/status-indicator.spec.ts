import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { StatusIndicator } from './status-indicator';

describe('StatusIndicator', () => {
  let fixture: ComponentFixture<StatusIndicator>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatusIndicator], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(StatusIndicator);
    fixture.componentRef.setInput('labelKey', 'TEST.LABEL');
  });

  it('shows the label in a tinted badge with a dot at its left', () => {
    fixture.detectChanges();
    expect(el().textContent).toContain('TEST.LABEL');
    const dot = el().querySelector('span[aria-hidden="true"]')!;
    expect(dot.className).toContain('bg-neutral');
    expect(el().querySelector('app-badge')!.className).toContain('bg-badge-neutral-bg');
  });

  it('maps each tone to its own token', () => {
    for (const tone of ['ok', 'bad', 'warn', 'neutral'] as const) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(el().querySelector('span[aria-hidden="true"]')!.className).toContain('bg-' + tone);
      expect(el().dataset['tone']).toBe(tone);
    }
  });

  it('exposes the info tone and the risk scale', () => {
    const dots = { info: 'bg-action', 'risk-low': 'bg-risk-low', 'risk-moderate': 'bg-risk-moderate', 'risk-high': 'bg-risk-high', 'risk-critical': 'bg-risk-critical' } as const;
    for (const [tone, dot] of Object.entries(dots)) {
      fixture.componentRef.setInput('tone', tone);
      fixture.detectChanges();
      expect(el().querySelector('span[aria-hidden="true"]')!.className).toContain(dot);
      expect(el().dataset['tone']).toBe(tone);
    }
  });

  it('sets the tooltip only when a hint is given', () => {
    fixture.detectChanges();
    expect(el().querySelector('[title]')).toBeNull();
    fixture.componentRef.setInput('hintKey', 'TEST.HINT');
    fixture.detectChanges();
    expect(el().querySelector('[title]')!.getAttribute('title')).toBe('TEST.HINT');
  });

  it('shows a text already translated by the caller instead of the key', () => {
    fixture.componentRef.setInput('label', 'Aprobada');
    fixture.detectChanges();
    expect(el().textContent).toContain('Aprobada');
    expect(el().textContent).not.toContain('TEST.LABEL');
  });
});
