/**
 * Typed reads of what the user typed or chose, for templates. Angular templates cannot cast, and `$any($event.target)` turns the type check off:
 * the component exposes these two (`protected readonly targetValue = targetValue;`) and the template says `(input)="name.set(targetValue($event))"`.
 */
type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** `value` of the input, select or textarea that fired the event. */
export function targetValue(event: Event): string {
  return (event.target as Field).value;
}

/** `checked` of the checkbox that fired the event. */
export function targetChecked(event: Event): boolean {
  return (event.target as HTMLInputElement).checked;
}
