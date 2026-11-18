import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviceIcon, osLogoOf } from './device-icon';

describe('DeviceIcon', () => {
  let fixture: ComponentFixture<DeviceIcon>;
  const el = () => fixture.nativeElement as HTMLElement;
  const render = (kind: 'computer' | 'mobile' | 'tablet' | null, os: string | null) => {
    fixture.componentRef.setInput('kind', kind);
    fixture.componentRef.setInput('os', os);
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DeviceIcon] });
    fixture = TestBed.createComponent(DeviceIcon);
  });

  it('is hidden from assistive technology and draws the logo with currentColor', () => {
    render('computer', 'Ubuntu');
    expect(el().getAttribute('aria-hidden')).toBe('true');
    expect(el().querySelector('[data-device-glyph]')!.textContent).toBe('laptop_chromebook');
    const svg = el().querySelector('[data-os-logo] svg')!;
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.querySelector('path')!.getAttribute('d')).toBeTruthy();
  });

  it('picks the glyph for each kind and a generic one without it', () => {
    const glyph = () => el().querySelector('[data-device-glyph]')!.textContent;
    render('mobile', 'Android');
    expect(glyph()).toBe('smartphone');
    render('tablet', 'iOS');
    expect(glyph()).toBe('tablet');
    render(null, null);
    expect(glyph()).toBe('devices');
  });

  it('shows no logo for an unknown system', () => {
    render('computer', null);
    expect(el().querySelector('[data-os-logo]')).toBeNull();
    render('computer', 'Haiku');
    expect(el().querySelector('[data-os-logo]')).toBeNull();
  });

  it('maps every system of the contract to a logo', () => {
    expect(['Windows', 'macOS', 'Linux', 'Ubuntu', 'ChromeOS', 'Android', 'iOS'].map(osLogoOf)).toEqual(['windows', 'apple', 'linux', 'linux', 'chrome', 'android', 'apple']);
  });
});
