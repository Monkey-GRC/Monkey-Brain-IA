import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `<app-empty-state icon="group" titleKey="TEST.TITLE" descriptionKey="TEST.DESC"><button action id="cta">Add</button></app-empty-state>`,
})
class Host {}

@Component({
  imports: [EmptyState],
  template: `<app-empty-state icon="" titleKey="TEST.TITLE" />`,
})
class NoIconHost {}

describe('EmptyState', () => {
  it('shows a bare line icon, the title, the description and the action slot', () => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const icon = el.querySelector('.material-symbols-rounded')!;
    expect(icon.textContent!.trim()).toBe('group');
    expect(icon.parentElement!.className).not.toContain('bg-');
    expect(el.textContent).toContain('TEST.TITLE');
    expect(el.textContent).toContain('TEST.DESC');
    expect(el.querySelector('#cta')).not.toBeNull();
  });

  it('draws no icon when the icon is empty', () => {
    TestBed.configureTestingModule({ imports: [NoIconHost], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(NoIconHost);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.material-symbols-rounded')).toBeNull();
  });
});
