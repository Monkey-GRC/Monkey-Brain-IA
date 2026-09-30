---
id: add-feature
name: Agregar una feature nueva
description: Pasos exactos para crear una feature completa en src/features/<nombre>, siguiendo la feature auth como referencia viva.
type: skill
applies_to: backend
---

# Skill: Agregar una feature nueva

**Referencia viva: `src/features/auth/`** — la primera feature del modelo nuevo, con las 4 capas
completas. `src/features/companies/` sigue el mismo patrón y es el ejemplo de CRUD con paginación.
Úsalas como plantilla: el código es la fuente de verdad, esta skill es el resumen.

> `risk`, `reason`, `control`, `client`, `user` y el resto de features del modelo viejo **ya no
> existen** (se borraron en el reset del schema, septiembre de 2026). Si una doc o un agente te
> manda usarlas de plantilla, esa doc está desactualizada.

## La estructura

```
src/features/<nombre>/
├── domain/
│   ├── entities/        clases y tipos de negocio (reglas puras: p. ej. Session.stateAt)
│   ├── repositories/    clases abstractas: lo que el dominio necesita de la persistencia
│   └── ports/           (si hace falta) otras abstracciones: hashers, firmas, servicios externos
├── application/
│   ├── dtos/            request con class-validator (nombres snake_case del contrato)
│   ├── use-cases/       uno por operación; dependen de las abstracciones, nunca de Prisma
│   └── *.token.ts       tokens de inyección para valores de configuración (p. ej. SESSION_POLICY)
├── infrastructure/
│   └── repositories/    <nombre>.prisma.repository.ts: implementa la abstracción con PrismaService
├── presentation/
│   ├── <nombre>.controller.ts
│   └── <nombre>-response.mapper.ts   entidad → JSON del contrato (snake_case)
└── <nombre>.module.ts   provide: XRepository → useClass: XPrismaRepository
```

**Lo que no es de una sola feature va fuera de ella**, para que ninguna feature importe el
interior de otra:

| Qué | Dónde |
|---|---|
| Sobre de respuesta, errores de dominio, filtro global, paginación, decoradores (`@Public`, `@Roles`, `@CurrentUser`), `RolesGuard`, `TenantScope`, puertos compartidos (`TokenHasher`, `AuditLogWriter`) | `src/common/` |
| `PrismaService` (con `withScope`), el writer de `audit_logs`, el HMAC de tokens | `src/infrastructure/` (módulos globales) |

## Pasos

1. **Leer el contrato** del módulo en `contracts/modules/` y las tablas en `modelo-datos.md`. Si el
   endpoint no está en el contrato, el contrato se acuerda primero.
2. **Entidades** en `domain/entities/`. Sin imports de `@nestjs/*`, `@prisma/*` ni de
   `infrastructure/`. Pueden importar tipos puros de `src/common/` (`TenantScope`, `UserRole`).
3. **Repositorio abstracto** en `domain/repositories/`: métodos con tipos propios, y **todo método
   que toque tablas con RLS recibe un `TenantScope`** (`companyId`, `userId`, `role`).
4. **DTOs** en `application/dtos/`, con `class-validator`. Los nombres de propiedad son los del
   contrato (`admin_email`, `requires_dedicated_database`). Nada de campos que el contrato no pide:
   el `ValidationPipe` global rechaza lo extra (`forbidNonWhitelisted`).
5. **Casos de uso** en `application/use-cases/`, uno por operación. Lanzan `DomainError` con el
   `error.code` del contrato; nunca excepciones HTTP. Si el código es nuevo, se agrega a
   `src/common/errors/domain-error.ts` y a su catálogo (status + clave i18n).
6. **Repositorio Prisma** en `infrastructure/repositories/`. **Toda consulta a una tabla con RLS
   va dentro de `this.prisma.withScope(scope, (tx) => …)`**: fija `app.tenant_id`, `app.user_id` y
   `app.user_role` para esa transacción (`modelo-datos.md` §4.4). Sin eso, RLS devuelve cero filas.
   Las búsquedas previas al tenant (login, canje, refresh) usan las funciones `SECURITY DEFINER`
   con `$queryRaw` y luego siguen con `withScope`.
7. **Controller** en `presentation/`. Solo mapea request → caso de uso → `ResponseDto` con el
   mapper. Todo endpoint exige sesión por defecto (`SessionAuthGuard` global); `@Public()` para lo
   abierto y `@Roles(...)` para restringir por rol. El usuario llega con `@CurrentUser()`.
8. **Módulo** `<nombre>.module.ts` con `provide: XRepository, useClass: XPrismaRepository` y los
   casos de uso; importarlo en `src/app.module.ts`.
9. **i18n**: las claves de `message` y de los errores en `i18n/es/<archivo>.json` e
   `i18n/en/<archivo>.json` a la vez (ver `add-i18n-error.md`).

## Después de terminar

- `npx nest build` sin errores. Ojo con `isolatedModules`: los tipos que aparecen en firmas
  decoradas (`Request`, `Response`, `Principal`, tipos de política) se importan con `import type`.
- Probar punto a punto contra la base de dev: camino feliz, 401 sin sesión, 403 por rol, 422 de
  validación, y los errores de negocio del contrato. Hoy **no hay `*.spec.ts`**: las pruebas de
  `auth` y `companies` se hicieron con scripts HTTP contra el servidor levantado.
- Confirmar en Swagger (`/v1/docs`) que los endpoints aparecen.
