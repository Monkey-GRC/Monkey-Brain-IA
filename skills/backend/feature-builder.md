---
id: feature-builder
name: Feature Builder
description: Checklist para construir una feature nueva end-to-end en src/features/<nombre>, respetando Clean Architecture y el patrón feature-based del repo.
type: skill
applies_to: backend
---

# Feature Builder (checklist)

## Propósito

Checklist de referencia para agregar una feature de negocio completa al
backend de Monkey, siguiendo exactamente el patrón ya establecido en
`src/features/risk` (la feature de referencia). La usa típicamente el agente
`backend-senior` (ver `../../agents/backend-senior.md`) cuando el tech-lead le
asigna la tarea.

## Cuándo usar esta skill

- El usuario pide "agregar/crear la feature X" (p. ej. `control`, un CRUD nuevo).
- El usuario pide exponer un nuevo recurso REST respaldado por un modelo Prisma.

## Contexto obligatorio antes de empezar

Lee, en este orden:
1. `../../context/project-context.md`
2. `add-feature.md` (los 8 pasos exactos a seguir)
3. El código real de `src/features/risk/**` como plantilla viva (no confíes solo
   en la documentación; el código es la fuente de verdad).

## Checklist de salida

- [ ] Entidad de dominio en `domain/entities/` sin imports de Prisma/Nest.
- [ ] Interfaz abstracta de repositorio en `domain/repositories/`.
- [ ] DTOs de entrada/salida en `application/dtos/` con `class-validator`.
- [ ] Un use-case por operación en `application/use-cases/`.
- [ ] Implementación Prisma del repositorio en `infrastructure/repositories/`.
- [ ] Controller en `presentation/` que solo transforma request/response.
- [ ] `*.module.ts` registrando el `provide/useClass` del repositorio.
- [ ] Módulo importado en `src/app.module.ts`.
- [ ] Si el modelo no existe en Prisma, agregarlo primero siguiendo
      `add-prisma-model.md`.
- [ ] Respuestas envueltas en `ResponseDto`.
- [ ] Guard `@UseGuards(AuthGuard('jwt'))` + `@ApiCookieAuth()` si el recurso
      requiere autenticación (todos los recursos de negocio la requieren salvo
      que se indique lo contrario).
- [ ] Mensajes de error nuevos agregados a `/i18n/en` y `/i18n/es` si aplica.

## Restricciones

- No violar la regla de dependencias (`Presentation → Application → Domain`,
  `Infrastructure → Domain`).
- No poner lógica de negocio en el controller ni en el repositorio Prisma.
- No reutilizar DTOs de otra feature; cada feature tiene los suyos.
