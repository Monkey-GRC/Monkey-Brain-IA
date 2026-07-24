---
id: architecture-guardian
name: Architecture Guardian (frontend)
description: Checklist para revisar cambios de código del frontend contra las reglas de capas (core/shared/features) y detectar violaciones.
type: skill
applies_to: frontend
---

# Architecture Guardian (frontend, checklist)

## Propósito

Checklist de revisión de arquitectura para el frontend Angular: verificar
que un diff o un componente/servicio nuevo respete la separación de capas,
no revisar estilo visual ni UX en detalle. La usa típicamente el `tech-lead`
al revisar el trabajo del `frontend-senior`.

## Contexto obligatorio

Leer `../../context/project-context.md` y
`../../../frontend/graphs-knowledge/architecture.md` antes de emitir un
veredicto.

## Reglas a verificar (en orden de gravedad)

1. **`core/` y `shared/` puros**: ningún archivo ahí importa de
   `features/<cualquier-nombre>/`. Si lo hace, es la violación más grave —
   invierte la dependencia que debería ir al revés.
2. **Sin features cruzadas**: `features/auth` no importa de
   `features/grc-framework` ni viceversa. Si dos features necesitan lo
   mismo, ese algo se mueve a `shared/`.
3. **Standalone components**: no se introducen `NgModule` nuevos — el repo
   es 100% standalone components + `loadComponent()` lazy routing.
4. **Path aliases**: se usan `@core/*`, `@features/*`, `@shared/*`,
   `@config/*`, `@environments/*` en vez de rutas relativas largas
   (`../../../`).
5. **Llamadas HTTP**: pasan por `HttpClient` + `environment.apiUrl` +
   `ApiResponse<T>` — ningún servicio crea su propio manejo de auth/errores
   por fuera de los interceptors globales (ver
   `../frontend/call-backend-api.md`).
6. **i18n**: todo texto visible al usuario usa una clave de traducción
   (`translate` pipe o `TranslateService`), agregada en `en` y `es` a la vez
   — nunca texto hardcodeado en el template.

## Formato de salida esperado

Lista de hallazgos, cada uno con: archivo:línea, regla violada, por qué es
un problema, y el fix concreto sugerido.
