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
