import { signal } from '@angular/core';
import { ClientList, includesText } from './client-list';

interface Item {
  code: string;
  name: string;
}

describe('ClientList', () => {
  const items = Array.from({ length: 25 }, (_, i) => ({ code: `C${i + 1}`, name: i % 2 ? 'Impar' : 'Par' }));
  const make = (source = signal<readonly Item[]>(items)) => new ClientList(source, (i, q) => includesText(q, i.code, i.name));

  it('pages ten by ten and counts the total', () => {
    const list = make();
    expect(list.rows().length).toBe(10);
    expect(list.info()).toEqual({ page: 1, pageSize: 10, total: 25, totalPages: 3 });
    list.goTo(3);
    expect(list.rows().length).toBe(5);
  });

  it('a search goes back to the first page and filters by code or name', () => {
    const list = make();
    list.goTo(3);
    list.search('c1');
    expect(list.info().page).toBe(1);
    expect(list.searching()).toBeTrue();
    expect(list.filtered().every((i) => i.code.toLowerCase().includes('c1'))).toBeTrue();
  });

  it('caps the page when fewer rows are left', () => {
    const list = make();
    list.goTo(3);
    list.search('C25');
    expect(list.info()).toEqual({ page: 1, pageSize: 10, total: 1, totalPages: 1 });
  });

  it('a new size restarts the page', () => {
    const list = make();
    list.goTo(2);
    list.resize(25);
    expect(list.info()).toEqual(jasmine.objectContaining({ page: 1, totalPages: 1 }));
    expect(list.rows().length).toBe(25);
  });

  it('follows the signal of the list, so a list replaced on a reload shows at once', () => {
    const current = signal<readonly Item[]>(items.slice(0, 3));
    const list = make(current);
    expect(list.info().total).toBe(3);
    current.set(items);
    expect(list.info().total).toBe(25);
    expect(list.rows().length).toBe(10);
  });

  it('filters with the other signals that matches reads (a chip filter)', () => {
    const onlyOdd = signal(false);
    const list = new ClientList(signal(items), (i, q) => (!onlyOdd() || i.name === 'Impar') && includesText(q, i.code));
    expect(list.info().total).toBe(25);
    onlyOdd.set(true);
    expect(list.info().total).toBe(12);
  });

  it('does not recalculate while nothing it reads changes', () => {
    let calls = 0;
    const list = new ClientList(signal(items), (i, q) => (calls++, includesText(q, i.code)));
    list.rows();
    list.info();
    list.filtered();
    expect(calls).toBe(items.length);
    list.goTo(2);
    list.rows();
    expect(calls).toBe(items.length);
    list.search('c2');
    list.rows();
    expect(calls).toBe(items.length * 2);
  });

  it('restart keeps the search; reset empties it too', () => {
    const list = make();
    list.search('par');
    list.goTo(2);
    list.restart();
    expect(list.page()).toBe(1);
    expect(list.query()).toBe('par');
    list.goTo(2);
    list.reset();
    expect(list.query()).toBe('');
    expect(list.page()).toBe(1);
  });

  it('includesText: an empty text matches everything; numbers and empty fields are fine', () => {
    expect(includesText('', null)).toBeTrue();
    expect(includesText('12', 'IAC', 12)).toBeTrue();
    expect(includesText('x', null, undefined, 'abc')).toBeFalse();
  });
});
