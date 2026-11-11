import { isTopOverlay, pushOverlay, takeEscape } from './overlay-stack';

describe('overlay-stack', () => {
  it('only the last pushed layer is on top, and the one below is back on top after a release', () => {
    const a = {};
    const b = {};
    const releaseA = pushOverlay(a);
    const releaseB = pushOverlay(b);
    expect(isTopOverlay(a)).toBeFalse();
    expect(isTopOverlay(b)).toBeTrue();
    releaseB();
    releaseB();
    expect(isTopOverlay(a)).toBeTrue();
    releaseA();
    expect(isTopOverlay(a)).toBeFalse();
  });

  it('takes Esc once: it prevents the default and ignores an event already handled', () => {
    const a = {};
    const release = pushOverlay(a);
    const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
    expect(takeEscape(a, event)).toBeTrue();
    expect(event.defaultPrevented).toBeTrue();
    expect(takeEscape(a, event)).toBeFalse();
    release();
  });
});
