import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DetailSection } from './detail-section';

@Component({
  imports: [DetailSection],
  template: `<app-detail-section titleKey="TEST.TITLE" [count]="4"><button actions id="edit">Edit</button><p id="body">Body</p></app-detail-section>
    <app-detail-section id="plain" titleKey="TEST.OTHER"><p>Other</p></app-detail-section>`,
})
class Host {}

describe('DetailSection', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('is a section labelled by its h3, with the actions next to the title and the body below it', () => {
    const el = setup();
    const section = el.querySelector('section')!;
    const h3 = section.querySelector('h3')!;
    expect(section.getAttribute('aria-labelledby')).toBe(h3.id);
    expect(h3.textContent).toContain('TEST.TITLE');
    expect(h3.parentElement!.querySelector('#edit')).not.toBeNull();
    const body = section.querySelector('#body')!;
    expect(h3.parentElement!.contains(body)).toBeFalse();
    expect(h3.compareDocumentPosition(body) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows the count after the title only when given, and every section has its own title id', () => {
    const el = setup();
    const [first, second] = Array.from(el.querySelectorAll('h3'));
    expect(first.querySelector('[data-section-count]')!.textContent).toBe('4');
    expect(second.querySelector('[data-section-count]')).toBeNull();
    expect(first.id).not.toBe(second.id);
  });
});
