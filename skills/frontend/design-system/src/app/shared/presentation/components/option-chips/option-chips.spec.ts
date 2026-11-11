import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OptionChips } from './option-chips';

describe('OptionChips', () => {
  let fixture: ComponentFixture<OptionChips>;
  const el = () => fixture.nativeElement as HTMLElement;
  const buttons = () => Array.from(el().querySelectorAll<HTMLButtonElement>('button'));

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [OptionChips] });
    fixture = TestBed.createComponent(OptionChips);
    fixture.componentRef.setInput('options', [
      { value: 'all', label: 'Todos' },
      { value: 'security', label: 'Seguridad' },
    ]);
    fixture.componentRef.setInput('selected', ['security']);
    fixture.detectChanges();
  });

  it('draws one button per option, with its word, pressed when selected, and emits the value picked', () => {
    expect(buttons().map((b) => b.textContent!.replace('check', '').trim())).toEqual(['Todos', 'Seguridad']);
    expect(buttons().map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    expect(buttons().map((b) => b.getAttribute('data-option'))).toEqual(['all', 'security']);
    const picked: string[] = [];
    fixture.componentInstance.picked.subscribe((v) => picked.push(v));
    buttons()[0].click();
    expect(picked).toEqual(['all']);
  });

  it('is a thin-bordered control with the radius and colour tokens, not a pill', () => {
    const [idle, chosen] = buttons();
    expect(idle.className).toContain('rounded-control');
    expect(idle.className).not.toContain('rounded-full');
    expect(idle.className).toContain('border-line');
    expect(chosen.className).toContain('border-action');
    expect(chosen.className).toContain('bg-tint');
    expect(el().innerHTML).not.toMatch(/(?:bg|text|border)-(?:primary|gray|green|red|amber)/);
  });

  it('is lower in a toolbar', () => {
    const normal = buttons()[0].className;
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(buttons()[0].className).not.toBe(normal);
    expect(buttons()[0].className).toContain('py-1.5');
  });
});
