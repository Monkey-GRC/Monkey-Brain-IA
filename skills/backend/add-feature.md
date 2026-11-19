---
id: add-feature
name: Agregar una feature nueva
description: Pasos exactos para crear una feature completa en src/features/<nombre>, siguiendo la feature auth como referencia viva.
type: recipe
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

**Features grandes: se agrupa por subfuncionalidad.** Cuando una carpeta pasa de unos 8 archivos, dentro de cada capa se crean subcarpetas por subfuncionalidad: `<capa>/<sub>/`. Es lo que hace `compliance` (`controls`, `evidence`, `exclusions`, `observations`, `overview`, `periods`, `responsibles`, `risks`, `verdicts`): `domain/controls/`, `application/controls/`, `infrastructure/controls/` y `presentation/controls/`. En ese caso el repositorio abstracto vive junto a su regla en `domain/<sub>/` y el caso de uso, su DTO y su validación en `application/<sub>/` (sin las carpetas `repositories/`, `use-cases/` ni `dtos/`). Lo que usan varias subfuncionalidades va en `<capa>/shared/`. En `auth` solo se agrupan los casos de uso (`application/use-cases/{session,mfa,access-key,activation}/`) y en `technical-control` el controlador interno del trabajador (`presentation/runner/`).

**Nombres:** inglés, `kebab-case` y `<sujeto>.<rol>.ts`: `.controller`, `.use-case` / `.use-cases`, `.dto`, `.query`, `.responses`, `-response.mapper`, `.repository`, `.prisma.repository`, `.validation`, `.spec`. La subcarpeta ya dice la subfuncionalidad, pero el archivo conserva su nombre completo para poder buscarlo.

**Lo que no es de una sola feature va fuera de ella**, para que ninguna feature importe el
interior de otra:

| Qué | Dónde |
|---|---|
| Sobre de respuesta, errores de dominio, filtro global, paginación, decoradores (`@Public`, `@Roles`, `@CurrentUser`), `RolesGuard`, `TenantScope`, puertos compartidos (`TokenHasher`, `AuditLogWriter`) | `src/common/` |
| `PrismaService` (con `withScope`), el writer de `audit_logs`, el HMAC de tokens | `src/infrastructure/` (módulos globales) |

## Pasos

1. **Leer el contrato** del módulo en `contracts/` y las tablas en `modelo-datos.md`. Si el
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
   **Un caso de uso que llama a más de un repositorio** abre **una** transacción con
   `TransactionRunner.run(scope, async () => …)` (D125). Los `withScope` de dentro, con el mismo scope, la reutilizan.
   El objetivo es que cada petición abra 2 transacciones: la del guard y la del caso de uso. Reglas:
   - **En serie:** nada de `Promise.all` sobre la transacción, tampoco dentro de un repositorio.
   - **Mismo scope:** un scope distinto es un error.
   - **Timeout:** el `timeoutMs` se pide en el `run`. Un `withScope` interno que pida más tiempo falla.
   - **Nada externo dentro:** correo, S3, la sonda o HTTP van antes o después del `run`, porque retienen la conexión.
   - **Errores de Postgres:** no se atrapan para seguir dentro del `run`, porque la transacción queda abortada. Un
     reintento por choque de unicidad va fuera del `run`.
   - **Sin promesas sueltas:** nada de promesas sin `await` dentro del `run`, porque heredarían una transacción ya cerrada.
   - **Medición:** con un spy sobre `$transaction` (ver `test/cumplimiento/transacciones-ruta.e2e-spec.ts`).
7. **Controller** en `presentation/`. Solo mapea request → caso de uso → `ResponseDto` con el
   mapper. Todo endpoint exige sesión por defecto (`SessionAuthGuard` global); `@Public()` para lo
   abierto y `@Roles(...)` para restringir por rol. El usuario llega con `@CurrentUser()`.
8. **Auditar** (SEG-36, D52). Todo método del repositorio que **cambia datos** recibe un último parámetro
   `audit: AuditIntent<Resultado>`: una función que el caso de uso construye con lo que ya sabe (usuario, IP,
   `before`) y que el repositorio ejecuta **dentro de la misma transacción**, con el resultado ya escrito, llamando a
   `insertAuditLog(tx, audit(resultado))`. Si el rastro falla, el cambio se revierte; nunca queda una acción sin
   rastro. El tipo hace obligatorio el parámetro: un método nuevo no compila sin él. `AuditLogWriter.write` es solo para
   lo que no acompaña a una acción revertible (intentos fallidos). Un `null` explícito se reserva a casos justificados
   (p. ej. cierres automáticos de sesión, DT-47) y se comenta por qué.
9. **Módulo** `<nombre>.module.ts` con `provide: XRepository, useClass: XPrismaRepository` y los
   casos de uso; importarlo en `src/app.module.ts`.
10. **i18n**: las claves de `message` y de los errores en `i18n/es/<archivo>.json` e
   `i18n/en/<archivo>.json` a la vez (ver `add-i18n-error.md`).

## Después de terminar

- `npx nest build` sin errores. Ojo con `isolatedModules`: los tipos que aparecen en firmas
  decoradas (`Request`, `Response`, `Principal`, tipos de política) se importan con `import type`.
- Probar punto a punto: camino feliz, 401 sin sesión, 403 por rol, 422 de validación, y los errores de negocio
  del contrato. Las pruebas viven en el repo (`Backend/test/`, `npm run test:e2e`, y se corren en el CI) contra un
  **Postgres desechable** (nunca la base compartida de dev): añade el recorrido de tu feature, el aislamiento entre
  empresas y, si audita, la prueba de que el rastro falla junto con la acción (ver `test/auditoria/`).
- Documentar cada endpoint en Swagger (MD-182) y confirmarlo en `/v1/docs`, que **solo existe en local** (`API_DOCS_ENABLED=true`; SEG-62):
  grupo (`@ApiTags(API_TAGS.<grupo>)`, con título y descripción en `common/swagger/api-docs.config.ts`), `@ApiOperation` en español,
  la respuesta con `@ApiData` / `@ApiPaged` / `@ApiItems` / `@ApiEmpty` / `@ApiNoBody` (el modelo es una clase solo de documentación
  `*.responses.ts` junto al mapper), los errores de negocio con `@ApiDomainErrors` y `@ApiProperty({ description, example, enum, enumName })`
  en cada campo del DTO. Los roles salen solos de `@Roles`/`@Public`. `npm test` falla si falta algo (`api-docs.spec.ts`).
