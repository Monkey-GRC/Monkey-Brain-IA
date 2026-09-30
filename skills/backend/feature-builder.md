---
id: feature-builder
name: Feature Builder
description: Checklist para construir una feature nueva end-to-end en src/features/<nombre>, respetando Clean Architecture y el patrón de la feature auth.
type: skill
applies_to: backend
---

# Feature Builder (checklist)

## Propósito

Checklist de referencia para agregar una feature de negocio completa al backend de Monkey,
siguiendo el patrón de `src/features/auth` (la feature de referencia; `src/features/companies` es
el ejemplo de CRUD paginado). La usa típicamente el agente `backend-senior` (ver
`../../agents/backend-senior.md`) cuando el tech-lead le asigna la tarea.

## Cuándo usar esta skill

- El usuario pide "agregar/crear la feature X".
- El usuario pide exponer un nuevo recurso REST respaldado por tablas del schema.

## Contexto obligatorio antes de empezar

Lee, en este orden:
1. `../../context/project-context.md`
2. El contrato del módulo en `../../contracts/modules/` y `../../contracts/conventions.md`
3. `add-feature.md` (los pasos exactos)
4. El código real de `src/features/auth/**` como plantilla viva.

## Checklist de salida

- [ ] Entidades en `domain/entities/` sin imports de Prisma/Nest.
- [ ] Repositorio abstracto en `domain/repositories/`, con `TenantScope` en todo lo que toque RLS.
- [ ] DTOs en `application/dtos/` con `class-validator` y los nombres del contrato.
- [ ] Un caso de uso por operación en `application/use-cases/`, que lanza `DomainError`.
- [ ] Repositorio Prisma en `infrastructure/repositories/`, con cada consulta dentro de
      `prisma.withScope(...)` (salvo las búsquedas previas al tenant vía funciones `SECURITY DEFINER`).
- [ ] Controller en `presentation/` que solo transforma request/response, con su mapper.
- [ ] `@Public()` solo donde el contrato lo diga; `@Roles(...)` donde el rol importe.
- [ ] `*.module.ts` registrando `provide/useClass` y los casos de uso; importado en `app.module.ts`.
- [ ] Respuestas envueltas en `ResponseDto`; errores con el `error.code` del contrato.
- [ ] Claves i18n en `i18n/es` e `i18n/en`.
- [ ] Acciones auditables registradas con `AuditLogWriter` (sin secretos en `after_state`).

## Restricciones

- No violar la regla de dependencias (`Presentation → Application → Domain`,
  `Infrastructure → Domain`).
- No poner lógica de negocio en el controller ni en el repositorio Prisma.
- Una feature no importa el interior de otra: lo compartido va a `src/common/` o
  `src/infrastructure/`.
- La app nunca se conecta como `postgres`: `PrismaService` usa `APP_DATABASE_URL` (`monkey_app`,
  sujeto a RLS).
