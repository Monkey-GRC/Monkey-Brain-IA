import { TestBed } from '@angular/core/testing';
import { QrCode } from './qr-code';

describe('QrCode', () => {
  it('draws the QR as an image with its accessible label', async () => {
    const fixture = TestBed.createComponent(QrCode);
    fixture.componentRef.setInput('value', 'otpauth://totp/Monkey:test?secret=ABC');
    fixture.componentRef.setInput('label', 'QR');
    fixture.componentRef.setInput('size', 120);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();
    const img = (fixture.nativeElement as HTMLElement).querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('QR');
    expect(img?.getAttribute('width')).toBe('120');
  });
});
