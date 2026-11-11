import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PageHeader } from './page-header';

@Component({
  imports: [PageHeader],
  template: `
    <app-page-header title="Services" description="What you declared" [backLink]="['/']" backLabel="Home">
      <button actions type="button">Add</button>
      <nav tabs>Tabs</nav>
    </app-page-header>
  `,
})
class Host {}

describe('PageHeader', () => {
  function render(): HTMLElement {
    TestBed.configureTestingModule({ imports: [Host], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the title, the description and the back link', () => {
    const el = render();
    expect(el.querySelector('h1')?.textContent).toContain('Services');
    expect(el.textContent).toContain('What you declared');
    expect(el.querySelector('a')?.textContent).toContain('Home');
  });

  it('projects the actions to the right and the tabs below, without a coloured background', () => {
    const el = render();
    expect(el.querySelector('[actions]')).not.toBeNull();
    expect(el.querySelector('[tabs]')).not.toBeNull();
    expect(el.querySelector('header')?.className).not.toMatch(/bg-/);
  });
});
