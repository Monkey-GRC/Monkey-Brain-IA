import { targetChecked, targetValue } from './event-target';

describe('event-target', () => {
  function fire<T extends HTMLElement>(el: T): Event {
    let seen!: Event;
    el.addEventListener('input', (e) => (seen = e));
    el.dispatchEvent(new Event('input'));
    return seen;
  }

  it('reads the value of an input, a select and a textarea', () => {
    const input = document.createElement('input');
    input.value = 'abc';
    const textarea = document.createElement('textarea');
    textarea.value = 'long text';
    const select = document.createElement('select');
    select.innerHTML = '<option value="a">A</option><option value="b" selected>B</option>';
    expect(targetValue(fire(input))).toBe('abc');
    expect(targetValue(fire(textarea))).toBe('long text');
    expect(targetValue(fire(select))).toBe('b');
  });

  it('reads checked of a checkbox', () => {
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = true;
    expect(targetChecked(fire(box))).toBe(true);
    box.checked = false;
    expect(targetChecked(fire(box))).toBe(false);
  });
});
