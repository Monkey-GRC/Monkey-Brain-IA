import { TestBed } from '@angular/core/testing';
import { MAX_VISIBLE_TOASTS, TOAST_DURATION_MS, TOAST_ERROR_DURATION_MS, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 0, 1));
    service = TestBed.inject(ToastService);
  });

  afterEach(() => {
    service.dismissAll();
    jasmine.clock().uninstall();
  });

  it('starts empty', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('shows each kind with its title and message, newest last', () => {
    service.showInfo('i', 'mi');
    service.showSuccess('s', 'ms');
    service.showWarning('w', 'mw');
    service.showError('e', 'me');
    expect(service.toasts().map((t) => [t.tone, t.title, t.message])).toEqual([
      ['info', 'i', 'mi'],
      ['success', 's', 'ms'],
      ['warning', 'w', 'mw'],
      ['error', 'e', 'me'],
    ]);
  });

  it('accepts a missing message', () => {
    service.showSuccess('Guardado');
    expect(service.toasts()[0].message).toBe('');
  });

  it('keeps at most the limit and drops the oldest', () => {
    for (let i = 1; i <= MAX_VISIBLE_TOASTS + 2; i++) service.showInfo(`t${i}`);
    const titles = service.toasts().map((t) => t.title);
    expect(titles.length).toBe(MAX_VISIBLE_TOASTS);
    expect(titles[0]).toBe('t3');
    expect(titles[titles.length - 1]).toBe(`t${MAX_VISIBLE_TOASTS + 2}`);
  });

  it('closes one toast by id and leaves the rest', () => {
    const a = service.showInfo('a');
    service.showInfo('b');
    service.dismiss(a);
    expect(service.toasts().map((t) => t.title)).toEqual(['b']);
  });

  it('closes by itself after 5 s (8 s for an error)', () => {
    service.showSuccess('ok');
    service.showError('fail');
    jasmine.clock().tick(TOAST_DURATION_MS - 1);
    expect(service.toasts().length).toBe(2);
    jasmine.clock().tick(1);
    expect(service.toasts().map((t) => t.tone)).toEqual(['error']);
    jasmine.clock().tick(TOAST_ERROR_DURATION_MS - TOAST_DURATION_MS);
    expect(service.toasts()).toEqual([]);
  });

  it('honours the duration the caller passes, and keeps the toast when it is 0', () => {
    service.showError('short', '', 1000);
    service.showInfo('sticky', '', 0);
    jasmine.clock().tick(60_000);
    expect(service.toasts().map((t) => t.title)).toEqual(['sticky']);
  });

  it('pauses the countdown with the pointer and resumes with what was left', () => {
    const id = service.showInfo('x');
    jasmine.clock().tick(3000);
    service.hold(id, 'hover');
    jasmine.clock().tick(60_000);
    expect(service.toasts().length).toBe(1);
    service.release(id, 'hover');
    jasmine.clock().tick(1999);
    expect(service.toasts().length).toBe(1);
    jasmine.clock().tick(1);
    expect(service.toasts()).toEqual([]);
  });

  it('stays paused while either the pointer or the focus is on it', () => {
    const id = service.showInfo('x');
    service.hold(id, 'hover');
    service.hold(id, 'focus');
    service.release(id, 'hover');
    jasmine.clock().tick(60_000);
    expect(service.toasts().length).toBe(1);
    service.release(id, 'focus');
    jasmine.clock().tick(TOAST_DURATION_MS);
    expect(service.toasts()).toEqual([]);
  });

  it('ignores hold and release of a toast that is gone', () => {
    const id = service.showInfo('x');
    service.dismiss(id);
    expect(() => {
      service.hold(id, 'hover');
      service.release(id, 'hover');
    }).not.toThrow();
  });

  it('dismissAll empties the list and cancels the timers', () => {
    service.showInfo('a');
    service.showError('b');
    service.dismissAll();
    expect(service.toasts()).toEqual([]);
    jasmine.clock().tick(60_000);
    expect(service.toasts()).toEqual([]);
  });
});
