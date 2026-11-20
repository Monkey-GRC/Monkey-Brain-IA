import { hasChanges } from './form-changes';

describe('hasChanges (MD-485)', () => {
  it('is false at the start and when what was typed is erased back', () => {
    expect(hasChanges({ name: '', email: null }, { name: '', email: null })).toBeFalse();
    expect(hasChanges({ name: '' }, { name: '   ' })).toBeFalse();
    expect(hasChanges({ name: null }, { name: '' })).toBeFalse();
    expect(hasChanges({ name: '' }, {})).toBeFalse();
  });

  it('is true as soon as a field holds something different from the start', () => {
    expect(hasChanges({ name: '' }, { name: 'A' })).toBeTrue();
    expect(hasChanges({ max: 10 }, { max: 20 })).toBeTrue();
    expect(hasChanges({ dedicated: false }, { dedicated: true })).toBeTrue();
    expect(hasChanges({ codes: ['soc2'] }, { codes: [] })).toBeTrue();
    expect(hasChanges({ when: new Date(1) }, { when: new Date(2) })).toBeTrue();
  });

  it('compares trimmed text and nested values', () => {
    expect(hasChanges({ a: { b: 'x' } }, { a: { b: ' x ' } })).toBeFalse();
    expect(hasChanges({ a: { b: 'x' } }, { a: { b: 'y' } })).toBeTrue();
    expect(hasChanges('Mismo', 'Mismo')).toBeFalse();
  });
});
