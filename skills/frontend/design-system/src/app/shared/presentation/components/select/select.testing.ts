// Helpers for specs that drive an `app-select` (the panel lives in <body>, outside the fixture). Not part of the product bundle: only specs import it.

/** The trigger button of the `app-select` that matches `hostSelector` (the `app-select` element itself, or a wrapper that contains it). */
export function selectTrigger(root: ParentNode, hostSelector: string): HTMLButtonElement | null {
  const host = root.querySelector<HTMLElement>(hostSelector);
  if (!host) return null;
  return host.matches('[data-select-trigger]') ? (host as HTMLButtonElement) : host.querySelector<HTMLButtonElement>('[data-select-trigger]');
}

function panelOptions(trigger: HTMLElement): HTMLElement[] {
  const panel = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
  return panel ? Array.from(panel.querySelectorAll<HTMLElement>('[data-select-option]')) : [];
}

/** Opens the select if it is closed, clicks the option with that value and runs change detection. In `multiple` mode call it once per value. */
export function pickOption(root: ParentNode, hostSelector: string, value: string, detect: () => void): void {
  const trigger = selectTrigger(root, hostSelector);
  if (!trigger) throw new Error(`No app-select for ${hostSelector}`);
  if (trigger.getAttribute('aria-expanded') !== 'true') {
    trigger.click();
    detect();
  }
  const option = panelOptions(trigger).find((o) => o.dataset['value'] === value);
  if (!option) throw new Error(`No option "${value}" in ${hostSelector}`);
  option.click();
  detect();
}

/** What the trigger shows (the chosen text, the placeholder or the filter name). */
export function selectText(root: ParentNode, hostSelector: string): string {
  return (selectTrigger(root, hostSelector)?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

/** The values of the options of the select (opens it if needed). */
export function optionValues(root: ParentNode, hostSelector: string, detect: () => void): string[] {
  const trigger = selectTrigger(root, hostSelector);
  if (trigger && trigger.getAttribute('aria-expanded') !== 'true') {
    trigger.click();
    detect();
  }
  return trigger ? panelOptions(trigger).map((o) => o.dataset['value'] ?? '') : [];
}

/** True when the element that matches `selector` is (or contains) an `app-select`. */
export function isSelect(root: ParentNode, selector: string): boolean {
  return selectTrigger(root, selector) !== null;
}

/** The text of all the options of the select (opens it if needed). */
export function optionsText(root: ParentNode, hostSelector: string, detect: () => void): string {
  const trigger = selectTrigger(root, hostSelector);
  if (trigger && trigger.getAttribute('aria-expanded') !== 'true') {
    trigger.click();
    detect();
  }
  return trigger ? panelOptions(trigger).map((o) => o.textContent ?? '').join(' | ') : '';
}
