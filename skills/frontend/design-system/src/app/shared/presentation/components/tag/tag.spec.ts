import { TestBed } from '@angular/core/testing';
import { Tag } from './tag';

describe('Tag', () => {
  it('shows the code as plain gray text, with no background or icon', () => {
    const fixture = TestBed.createComponent(Tag);
    fixture.componentRef.setInput('text', 'CC6.1');
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent!.trim()).toBe('CC6.1');
    expect(el.className).toContain('text-ink-muted');
    expect(el.className).not.toContain('bg-');
    expect(el.querySelector('.material-symbols-rounded')).toBeNull();
  });
});
