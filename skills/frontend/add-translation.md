---
id: add-translation
name: Agregar una traducción (i18n)
description: Cómo agregar claves de texto nuevas usando ngx-translate, manteniendo en y es sincronizados.
type: skill
applies_to: frontend
---

# Skill: Agregar una traducción (i18n)

El frontend usa `@ngx-translate/core` + `ngx-translate-multi-http-loader`,
cargando JSON estático desde `public/i18n/{en,es}/<archivo>.json` (no
`src/assets`) vía `HttpBackend` — esto bypasea los interceptors HTTP a
propósito, así que no necesita auth.

## Pasos

1. Elegir/crear el archivo de locale por feature (p. ej. `risk.json`,
   `sidebar.json`) — mismo nombre de archivo en `public/i18n/en/` y
   `public/i18n/es/`.

2. Agregar la clave nueva en **ambos** idiomas con la misma estructura
   anidada, en mayúsculas por convención de sección (ver `RISK.HEADER.TITLE`
   como ejemplo existente):
   ```json
   { "RISK": { "HEADER": { "TITLE": "Riesgos", "BTN_CREATE": "Crear riesgo" } } }
   ```

3. Usarla en el template con el pipe `translate`:
   ```html
   <h1>{{ 'RISK.HEADER.TITLE' | translate }}</h1>
   ```
   o en TypeScript con `TranslateService.instant('RISK.HEADER.TITLE')` cuando
   no hay template disponible (mensajes de toast, por ejemplo).

## Restricciones

- Nunca agregar una clave en un solo idioma — `en` y `es` siempre en el
  mismo commit/cambio.
- No hardcodear texto visible al usuario directamente en el template ni en
  el TypeScript — toda cadena user-facing pasa por una clave de traducción.
- Seguir la convención de nombres ya usada por feature (`SIDEBAR.*`,
  `RISK.*`, `HOME`) — no mezclar mayúsculas/minúsculas dentro de la misma
  jerarquía.

## En Frontend-Platform

Mismo patrón (`public/i18n/{es,en}/<area>.json`, pipe `translate`), con estas diferencias:

- Los archivos que se cargan se listan en `I18N_FILES` de `src/app/app.config.ts`; un archivo nuevo se agrega ahí.
- El idioma lo maneja `LanguageService` (`core/domain/services/language.service.ts`): `current()` es una señal, `set()`/`toggle()` cambian
  el idioma y `storedLanguage()` lo lee sin inyectar. El interceptor lo manda como `Accept-Language`.
- Al cambiar el idioma la pantalla **no se recrea** (se perdería lo que el cliente escribió). Los textos fijos cambian solos con `translate`.
  Lo que el backend traduce (catálogos) se vuelve a pedir con un `effect` sobre `language.current()` que solo reasigna esas listas, nunca
  reinicia `stage` ni el formulario. Toda pantalla nueva que pida catálogos debe hacerlo. La caché de `CatalogService` es por idioma.
- Un texto que sale de una constante o de un modelo (no de la plantilla) guarda la **clave**, no el texto, y la pantalla la pasa por
  `translate` (ver `SCENARIO_HELP` en `technical-control.models.ts`).
- Textos con variables: `"Paso {{current}} de {{total}}"` y `{{ 'CLAVE' | translate: { current: 1, total: 6 } }}`. No hay plurales ICU:
  dos claves (`..._ONE`, `..._MANY`) y se elige en la plantilla.
- Los textos de Cumplimiento usan el vocabulario del dominio fijado en D80 (controles, riesgos, causas, evidencias, requisitos, marcos, tratamiento, riesgo residual) en `compliance.json`, nunca palabras sueltas ni eufemismos.