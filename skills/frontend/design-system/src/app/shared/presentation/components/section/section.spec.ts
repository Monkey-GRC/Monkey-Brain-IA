import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { Section } from './section';

@Component({
  imports: [Section],
  template: `
    <app-section titleKey="TEST.TITLE" descriptionKey="TEST.DESC">
      <button actions id="act">Go</button>
      <p id="body">content</p>
    </app-section>
    <app-section id="bare"><p>only body</p></app-section>
  `,
})
class Host {}

describe('Section', () => {
  it('draws the base card surface (border, minimal shadow) with a titled header line', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const first = el.querySelector('app-section')!;
    expect(first.className).toContain('mk-surface');
    expect(first.className).not.toMatch(/shadow-(?!soft)/);
    expect(first.querySelector('h2')!.textContent).toContain('TEST.TITLE');
    expect(first.textContent).toContain('TEST.DESC');
    expect(first.querySelector('header')!.querySelector('#act')).not.toBeNull();
    expect(first.querySelector('#body')).not.toBeNull();
  });

  it('has no header when it has no title', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('#bare header')).toBeNull();
  });
});
