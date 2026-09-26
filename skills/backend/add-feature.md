---
id: add-feature
name: Agregar una feature nueva
description: Pasos exactos para crear una feature completa en src/features/<nombre>, tal como documenta el README del repo usando "control" como ejemplo.
type: skill
applies_to: backend
---

# Skill: Agregar una feature nueva

Referencia viva: `src/features/risk/` es la feature más completa del repo y la que mejor
sigue las 4 capas. Features existentes hoy: `asset`, `auth`, `checklist`, `client`, `control`,
`manual-check`, `reason`, `risk`, `translation`, `user`.

> ⚠️ El `README.md` del `Backend` está desactualizado (pide `DATABASE_URL` y `npm run db:seed`,
> que no existen). No lo uses como referencia sin contrastarlo con el código.

## Pasos

1. **Entidad de dominio** — `src/features/<nombre>/domain/entities/<nombre>.entity.ts`.
   Lógica de negocio pura, sin Prisma ni Nest.

2. **Interfaz del repositorio** — `src/features/<nombre>/domain/repositories/<nombre>.repository.ts`.
   Clase abstracta con los métodos que necesita el dominio (`findAll`, `create`,
   `update`, `delete`, etc.), usando tipos propios, no tipos de Prisma.

3. **DTOs** — `src/features/<nombre>/application/dtos/`. Con `class-validator`
   y `class-transformer` para request/response.

4. **Use-cases** — `src/features/<nombre>/application/use-cases/`, uno por
   operación (`create-<nombre>.use-case.ts`, `get-all-<nombre>s.use-case.ts`,
   `update-<nombre>.use-case.ts`, `delete-<nombre>.use-case.ts`). Cada use-case
   depende de la interfaz abstracta del repositorio, no de Prisma.

5. **Repositorio Prisma** — `src/features/<nombre>/infrastructure/repositories/<nombre>.prisma.repository.ts`.
   Implementa la interfaz del paso 2 usando `CentralPrismaService`
   (`src/infrastructure/database/central-prisma.service.ts`), o la conexión del tenant vía
   `TenantConnectionManagerService` si la entidad vive en la base del cliente.
   **No existe una clase `PrismaService`.**

6. **Controller** — `src/features/<nombre>/presentation/<nombre>.controller.ts`.
   Mapea rutas HTTP a use-cases. Usa `@UseGuards(AuthGuard('jwt'))` +
   `@ApiCookieAuth()` si requiere auth. Envuelve respuestas en `ResponseDto`.

7. **Módulo** — `src/features/<nombre>/<nombre>.module.ts`. Registra:
   ```ts
   providers: [
     { provide: <Nombre>Repository, useClass: <Nombre>PrismaRepository },
     Create<Nombre>UseCase, GetAll<Nombre>sUseCase, Update<Nombre>UseCase, Delete<Nombre>UseCase,
   ],
   controllers: [<Nombre>Controller],
   ```

8. **Registrar en `app.module.ts`** — importar `<Nombre>Module` en los
   `imports` del módulo raíz.

## Antes de empezar, verificar

- Si el modelo de datos no existe, agregarlo primero en `prisma/central/schema/` y/o
  `prisma/tenant/schema/` (ver `add-prisma-model.md`) y correr la migración con su `--config`.
- Revisar si el modelo ya existe para no duplicar el schema.
- Contrastar la entidad con `modelo-datos.md`: el schema actual se está rehaciendo y el modelo
  es el plan vigente (ver `CLAUDE.md`).

## Después de terminar

- Correr `npm run lint` y `npm run test`. Ojo: hoy **no hay ni un `*.spec.ts`** en el repo,
  así que `npm run test` no ejercita nada todavía.
- Confirmar en Swagger (`@nestjs/swagger`) que los endpoints nuevos aparecen
  documentados.
