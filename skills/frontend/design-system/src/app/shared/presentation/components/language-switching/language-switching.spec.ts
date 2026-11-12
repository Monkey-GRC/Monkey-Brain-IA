import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitching } from './language-switching';

describe('LanguageSwitching', () => {
  it('shows the message in a polite live region', () => {
    TestBed.configureTestingModule({ imports: [LanguageSwitching, TranslateModule.forRoot()] });
    const fixture = TestBed.createComponent(LanguageSwitching);
    fixture.componentRef.setInput('message', 'Cambiando el idioma…');
    fixture.detectChanges();
    const region = (fixture.nativeElement as HTMLElement).querySelector('[aria-live="polite"]');
    expect(region?.textContent).toContain('Cambiando el idioma…');
    expect(region?.getAttribute('role')).toBe('status');
  });
});
