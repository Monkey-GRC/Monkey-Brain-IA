import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { UnreadDot } from './unread-dot';

@Component({
  imports: [UnreadDot],
  template: `<app-unread-dot [unread]="unread()" />`,
})
class Host {
  readonly unread = signal(true);
}

describe('UnreadDot', () => {
  it('marks the row as unread and as read, always hidden from screen readers', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const dot = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('app-unread-dot')!;
    expect(dot.getAttribute('data-unread')).toBe('true');
    expect(dot.getAttribute('aria-hidden')).toBe('true');
    fixture.componentInstance.unread.set(false);
    fixture.detectChanges();
    expect(dot.getAttribute('data-unread')).toBe('false');
  });
});
