import { InjectionToken, Type } from '@angular/core';

/**
 * The components the app header shows before the help and the profile menus (today, the notices bell in Platform). It is a `multi` token: each one is provided
 * on its own (`{ provide: HEADER_WIDGETS, useValue: NotificationBell, multi: true }`), so a second widget adds to the first instead of replacing it; they show in
 * the order they are provided. The app provides them in `app.config.ts`, the only layer that sees `core` and the features at once: `core/` never imports from
 * `features/`. Without a provider (Admin) the header shows nothing extra.
 */
export const HEADER_WIDGETS = new InjectionToken<readonly Type<unknown>[]>('HEADER_WIDGETS');
