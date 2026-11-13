import { TestBed } from '@angular/core/testing';
import { Tag } from './tag';

describe('Tag', () => {
  it('shows the code as a brand badge (rounded rectangle, tinted, no icon)', () => {
    const fixture = TestBed.createComponent(Tag);
    fixture.componentRef.setInput('text', 'CC6.1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent!.trim()).toBe('CC6.1');
    const badge = el.querySelector('app-badge')!;
    expect(badge.getAttribute('data-kind')).toBe('code');
    expect(badge.className).toContain('rounded-badge');
    expect(badge.className).toContain('bg-badge-brand-bg');
    expect(el.querySelector('.material-symbols-rounded')).toBeNull();
  });
});
