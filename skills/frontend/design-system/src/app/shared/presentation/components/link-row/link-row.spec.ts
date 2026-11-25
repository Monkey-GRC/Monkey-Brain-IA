import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LinkRow, splitTitle } from './link-row';

@Component({
  imports: [LinkRow],
  template: `
    <div role="list">
      <app-link-row [title]="title()" [description]="description()" [unlinkable]="unlinkable()" unlinkLabel="Quitar el vínculo con CC6.1#1" (unlink)="unlinked = unlinked + 1">
        <span code id="code">CC6.1#1</span>
        <span meta id="meta">Política</span>
      </app-link-row>
    </div>
  `,
})
class Host {
  readonly title = signal('Identifica información confidencial para su destrucción —Existen procedimientos para identificarla.');
  readonly description = signal<string | null>(null);
  readonly unlinkable = signal(true);
  unlinked = 0;
}

describe('LinkRow', () => {
  let fixture: ComponentFixture<Host>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideTranslateService()] });
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('splits «título — descripción» into a bold title and a secondary description, with the code on the title line and the chips in their own column', () => {
    expect(el().querySelector('[data-link-title]')!.textContent).toBe('Identifica información confidencial para su destrucción');
    expect(el().querySelector('[data-link-description]')!.textContent).toBe('Existen procedimientos para identificarla.');
    expect(el().querySelector('[data-link-title]')!.parentElement!.querySelector('#code')).not.toBeNull();
    expect(el().querySelector('[data-link-meta] #meta')).not.toBeNull();
  });

  it('uses the description it is given and leaves a title without a dash whole', () => {
    fixture.componentInstance.title.set('Gestión de accesos');
    fixture.componentInstance.description.set('Otro texto');
    fixture.detectChanges();
    expect(el().querySelector('[data-link-title]')!.textContent).toBe('Gestión de accesos');
    expect(el().querySelector('[data-link-description]')!.textContent).toBe('Otro texto');
    expect(splitTitle('Sin guion')).toEqual({ title: 'Sin guion', description: null });
    expect(splitTitle('Título — ')).toEqual({ title: 'Título', description: null });
  });

  it('unlinks with a button that has text and an accessible name, never an icon alone', () => {
    const button = el().querySelector<HTMLButtonElement>('[data-unlink]')!;
    expect(button.textContent).toContain('COMMON.UNLINK');
    expect(button.getAttribute('aria-label')).toBe('Quitar el vínculo con CC6.1#1');
    expect(button.type).toBe('button');
    button.click();
    expect(fixture.componentInstance.unlinked).toBe(1);
    fixture.componentInstance.unlinkable.set(false);
    fixture.detectChanges();
    expect(el().querySelector('[data-unlink]')).toBeNull();
  });
});
