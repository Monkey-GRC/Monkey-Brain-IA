import { canGoBack, canGoForward, visibleRange } from './table-page';

describe('table page helpers', () => {
  const page = (p: number, pageSize: number, total: number) => ({ page: p, pageSize, total, totalPages: Math.ceil(total / pageSize) });

  it('shows the range of rows on the page', () => {
    expect(visibleRange(page(1, 25, 120))).toEqual({ from: 1, to: 25 });
    expect(visibleRange(page(2, 25, 120))).toEqual({ from: 26, to: 50 });
  });

  it('clamps the last page to the total', () => {
    expect(visibleRange(page(5, 25, 120))).toEqual({ from: 101, to: 120 });
  });

  it('shows 0–0 when there is nothing', () => {
    expect(visibleRange(page(1, 25, 0))).toEqual({ from: 0, to: 0 });
  });

  it('knows the edges', () => {
    expect(canGoBack(page(1, 25, 120))).toBeFalse();
    expect(canGoBack(page(2, 25, 120))).toBeTrue();
    expect(canGoForward(page(5, 25, 120))).toBeFalse();
    expect(canGoForward(page(4, 25, 120))).toBeTrue();
  });
});
