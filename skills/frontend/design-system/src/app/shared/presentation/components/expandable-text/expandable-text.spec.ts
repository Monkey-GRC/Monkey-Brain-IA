import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ExpandableText } from './expandable-text';

@Component({
  imports: [ExpandableText],
  template: `<div class="w-60"><app-expandable-text [text]="text()" textClass="text-sm leading-relaxed" moreKey="TEST.MORE" lessKey="TEST.LESS" /></div>`,
})
class Host {
  readonly text = signal('Corto.');
}

const LONG = 'La política define quién aprueba un acceso, cuánto dura y cómo se revoca. Se revisa que esté aprobada por la dirección, publicada y vigente durante el período, y que nombre al responsable de cada sistema productivo.';

describe('ExpandableText', () => {
  let fixture: ComponentFixture<Host>;
  const el = () => fixture.nativeElement as HTMLElement;
  const toggle = () => el().querySelector<HTMLButtonElement>('[data-expandable-toggle]');
  const settle = async () => {
    fixture.detectChanges();
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 30));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    await settle();
  });

  it('shows a text that fits whole, without the link', () => {
    expect(el().querySelector('[data-expandable-text]')!.textContent).toContain('Corto.');
    expect(toggle()).toBeNull();
  });

  it('offers «ver más» only when the text is really cut, opens it and closes it', async () => {
    fixture.componentInstance.text.set(LONG);
    await settle();
    const text = el().querySelector<HTMLElement>('[data-expandable-text]')!;
    expect(text.className).toContain('line-clamp-2');
    expect(toggle()).not.toBeNull();
    expect(toggle()!.getAttribute('aria-expanded')).toBe('false');
    expect(toggle()!.getAttribute('aria-controls')).toBe(text.id);
    expect(toggle()!.tagName).toBe('BUTTON');
    toggle()!.click();
    await settle();
    expect(text.className).not.toContain('line-clamp-2');
    expect(toggle()!.textContent).toContain('TEST.LESS');
    toggle()!.click();
    await settle();
    expect(text.className).toContain('line-clamp-2');
  });
});
