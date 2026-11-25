import type { PageInfo } from '@shared/domain/models/page-info.model';

// Helpers of the page bar over the `PageInfo` the backend returns (`shared/domain/models/page-info.model`).

export function visibleRange(page: PageInfo): { from: number; to: number } {
  if (page.total === 0) return { from: 0, to: 0 };
  return { from: (page.page - 1) * page.pageSize + 1, to: Math.min(page.page * page.pageSize, page.total) };
}

export function canGoBack(page: PageInfo): boolean {
  return page.page > 1;
}

export function canGoForward(page: PageInfo): boolean {
  return page.page < page.totalPages;
}

/**
 * The page numbers to show: always the first, the last and the neighbours of the current one; `null` is a gap («…»).
 * With 7 pages or fewer all of them show. Example: 1 … 4 5 6 … 12.
 */
export function pageWindow(current: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const wanted = new Set([1, totalPages, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => wanted.add(n));
  if (current >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((n) => wanted.add(n));
  const sorted = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(null);
    out.push(n);
  });
  return out;
}
