---
id: backend-context
name: Monkey Backend - convenciones y mapa de features
description: Convenciones, arquitectura por capas y mapa de features del repo Backend (NestJS). Lo estable; el estado fino se lee del código.
type: context
---

# Monkey Backend

> Describe el código tal como está, no el diseño objetivo. El plan vigente es
> `skills/product/monkey-compliance-council/references/datos/modelo-datos.md`.
> Aquí no van conteos, versiones menores, números de PR ni fechas: eso se lee del código y de git.

**Rutas.** Las rutas de código (`src/...`, `prisma/...`, `i18n/...`) son relativas a la raíz del repo
`Backend`, carpeta hermana de `Monkey-Brain-IA`.

## Dominio y aislamiento

Compliance continuo: mide el cumplimiento de un cliente frente a los marcos que contrató (MVP: solo
SOC 2) sobre sus servicios y activos. Modelo completo en `modelo-datos.md`; implementación (Prisma 7,
RLS, roles, migraciones, `.env`) en `schema-implementacion.md`.

**Multi-tenant (D25).** Una base con cuatro schemas de Postgres (`catalog`, `platform`, `tenant`,
`audit`); los clientes se aíslan por Row-Level Security sobre `tenant_id`/`company_id`. La app se
conecta como `monkey_app` (sin superusuario ni `BYPASSRLS`) y fija el tenant por transacción. La base
dedicada por cliente no está construida y el registro la rechaza (`DEDICATED_DATABASE_NOT_AVAILABLE`,
`contracts/empresas.md`).

## Stack

NestJS (Express), TypeScript, Prisma 7 (`prisma-client`, `moduleFormat = "cjs"`, `@prisma/adapter-pg`),
PostgreSQL, `class-validator`, `@nestjs/swagger` (`/v1/docs`, **solo local** con `API_DOCS_ENABLED=true`; SEG-62), `nestjs-i18n` (`/i18n/{en,es}`), Jest +
supertest, ESLint 9 + Prettier. Versiones exactas: `package.json`.

- **Roles:** cinco (`admin_monkey`, `admin_empresa`, `responsable`, `delegado`, `auditor`; D96, D102); no hay roles personalizados. El `admin_empresa` es el experto en compliance y asigna el dueño de cada control; el `responsable` es dueño de sus controles y revisa lo de su equipo; el `delegado` ejecuta lo que su responsable le asigna (`contracts/gestion-usuarios.md`). **El esquema y el enum ya son los de D102 (MD-186, 2026-11-04); la lógica de equipo, grupos, cupo y asignación llega con el resto del sprint 3;** el auditor pertenece a su empresa y revisa sin calificar (D63, D96).
- **Auth:** access token JWT HS256 de corta vida + refresh token opaco rotado, ambos en cookies
  httpOnly; contraseñas con bcrypt. Detalle y límites en `contracts/autenticacion.md`.
- **Pruebas:** unitarias (`*.spec.ts`), verificadores contra la base (`catalog:verify`,
  `clone:verify`, `audit:verify`) y aislamiento entre empresas en `test/` (`npm run test:e2e`).
  Estado y cobertura real en [`seguridad/`](../skills/product/monkey-compliance-council/references/seguridad/README.md).
- **CI/CD:** `ci.yml` (lint, build, pruebas y verificadores en cada PR) y `deploy-dev.yml` (migra solo
  antes de levantar, con respaldo previo, D42). Limitación vigente: DT-41.

## Arquitectura

Clean Architecture + feature-based. Cada feature en `src/features/<nombre>/`:

| Capa | Carpeta | Responsabilidad |
|------|---------|-----------------|
| Domain | `domain/` | Entidades, repositorios abstractos y puertos. Cero dependencias externas. |
| Application | `application/` | Casos de uso y DTOs. No sabe de HTTP ni de Prisma. Lanza `DomainError`. |
| Infrastructure | `infrastructure/` | Repositorios Prisma (siempre con `prisma.withScope`) y adaptadores como el almacenamiento S3 / minio (`infrastructure/storage`, variables `S3_*`; ver `schema-implementacion.md` §8). |
| Presentation | `presentation/` | Controladores HTTP y mappers al JSON del contrato. |

Dependencias: `Presentation → Application → Domain` e `Infrastructure → Domain`.

Una feature grande se agrupa por subfuncionalidad dentro de cada capa: `compliance/<capa>/<sub>/` (por ejemplo `compliance/presentation/observations/`), con lo compartido en `<capa>/shared/`. En `auth`, los casos de uso van en `application/use-cases/<sub>/`. Las reglas y los nombres están en `skills/backend/add-feature.md`.

Lo transversal vive fuera de las features: `src/common/` (sobre `ResponseDto`, `DomainError`, filtro
global de excepciones, paginación, decoradores `@Public`/`@Roles`/`@CurrentUser`, `RolesGuard`,
`TenantScope`, `Principal`, puertos como `TokenHasher` y `AuditLogWriter`, y el cupo de usuarios en `common/quota`, que usan `team`, `companies` y `auth` sin importarse entre sí) y `src/infrastructure/`
(`PrismaService`, writer de `audit_logs`, HMAC de tokens).

## Mapa de features

Una línea por feature: para qué sirve y dónde está su contrato. Si el código y esta lista difieren,
manda el código y se corrige esta lista.

| Feature | Qué hace | Contrato / decisión |
|---|---|---|
| `auth` | Login, refresh, logout, `me`, activación de cuenta en dos pasos, segundo factor (D94), activación de las cuentas que crea el administrador con un código de un solo uso (D95, D96). **Feature de referencia** (4 capas completas). | `contracts/autenticacion.md` · `contracts/gestion-usuarios.md` · D43, D51, D94, D95, D96 |
| `companies` | Registro de empresas por `admin_monkey`; marcos contratados; clave de acceso de un solo uso que se **envía por correo** (D99; puerto `Mailer`, adaptadores en `infrastructure/mail`) y se reenvía con una nueva. **Cupo de usuarios (D103, MD-187):** `max_users` obligatorio al registrar (entero ≥ 1; `NULL` = empresa anterior al cupo, sin tope), `max_users` y `users_count` en el listado y el detalle (el conteo sale de `platform.company_users_count`, SEG-77), y `PATCH /v1/companies/:id/max-users` solo para `admin_monkey` (`409 MAX_USERS_BELOW_CURRENT`, rastro `company.max_users_update` atómico). | `contracts/empresas.md` · D47, D50, D103 · SEG-72, SEG-77 |
| `users` | *(D102 y D104; esquema de MD-186, alta y lista de MD-188)* El equipo de la empresa: el `admin_empresa` invita, edita y desactiva cuentas; el `responsable` crea delegados de su equipo. Tablas `user_groups` (nombre único por empresa) y `client_control_assignments` (dueño y ejecutor por control del cliente), `users.group_id`, `users.is_internal` y `companies.max_users`, con RLS y CHECK. Construido: el cupo (MD-187), el alta con grupo e `is_internal` y la lista (MD-188), y los grupos con el movimiento de delegados (MD-189). Falta: la baja con aviso (MD-191) y la asignación (MD-192). | `contracts/gestion-usuarios.md` · D96 · D102 · MD-131, MD-132, MD-134, MD-158 |
| `catalogs` | Opciones de los formularios con etiqueta según `Accept-Language`. Valores en `src/common/catalogs/onboarding-catalogs.ts`; solo regulaciones y marcos salen de la base. | `contracts/enums.md` |
| `onboarding` | Componente 1 (contexto organizacional) y derivación del avance para `me`. | `contracts/onboarding/contexto-organizacional.md` · D44 |
| `services` | Componente 2 (contexto del servicio). **Crear o ampliar un servicio clona el catálogo del marco en la misma transacción** (`CloneCatalogService`). | `contracts/onboarding/contexto-servicio.md` · D40, D45, D51 |
| `compliance` | **Motor de evaluación** (`domain/engine/`, funciones puras, sin base de datos): estado de un test, un control, una categoría y un marco, y el semáforo de un activo (§9, D68). Con él, los controles: `GET /v1/services/:id/controls` y `GET /v1/controls/:id` (vista de negocio y técnica), `POST /v1/services/:id/controls` (control propio) y `PATCH`/`DELETE /v1/controls/:id` (editar y dar de baja, directo); `/v1/responsibles` (cargos responsables); y riesgos y causas con sus vínculos (`/v1/services/:id/risks`, `/v1/risks/:id`, `/v1/services/:id/causes`, `/v1/causes/:id`), con la evaluación 5×5 y el tratamiento de un riesgo (`POST /v1/risks/:id/evaluation`, `GET …/evaluation-history`, `POST`/`GET …/treatments`). y las exclusiones de un activo en un test (`GET`/`POST /v1/services/:id/exclusions`, MD-144; nacen aprobadas, D96); y las evidencias de un control: `GET /v1/controls/:id/evidence`, `POST`/`GET /v1/evidence-requirements/:id/submissions` (archivo con su huella SHA-256 y versión, que nunca pisa la anterior) y `GET /v1/evidence-submissions/:id/download` (enlace firmado de 5 minutos, MD-126). La **revisión de la evidencia** (`PUT /v1/evidence-submissions/:id/review`, MD-127) la hace solo el `admin_empresa`, en una sola revisión por entrega (`evidence_reviews`, D96); el `responsable`, el `delegado` y el auditor la leen; y `POST /v1/controls/:id/tests/:testId/evidence` sube la evidencia de **una prueba documental en un solo paso** (crea el lugar de esa prueba en la primera entrega, D88). **El estado de una prueba documental sale, por control, de lo entregado para esa prueba** (`control-readout.ts`). **El veredicto de una prueba manual que no es documental** (`POST`/`GET /v1/controls/:id/tests/:testId/verdicts`, solo el `admin_empresa` da; MD-155) deja una evaluación inmutable por control del servicio que lleva la prueba y por activo de su dimensión. **La evaluación del auditor** (`/assessments`, `framework_assessments`, MD-155) se retiró con D96 y `P35`; la tabla queda sin uso. **Todo cambio de estado de un control deja un evento** `control.state` en `compliance_events`, escrito en la misma transacción por el veredicto, la entrega y la revisión de evidencia, aprobar una exclusión y la sonda (`control-state-events.ts`, D91). Las **evaluaciones** son inmutables para todos los roles de la base (triggers, `SEG-38`). Las **observaciones** del auditor (`presentation/observations`, MD-154) y el **período auditado** (`presentation/periods`, D87) sí están construidos; lo que falta es excluir un *check* concreto (hoy la exclusión es de un activo en una prueba). | `contracts/cumplimiento/controles.md` · `modelo-datos.md` §9 · MD-117, MD-123, MD-126, MD-127, MD-138, MD-139, MD-144, MD-145, MD-155 · `contracts/cumplimiento/evidencia.md` · `contracts/cumplimiento/veredictos.md` · `contracts/cumplimiento/resumen.md` · D88, D91 · DT-50, DT-71, DT-76, DT-79, DT-80 |
| `team` | **El equipo de la empresa** (D102, esquema de MD-186) — `POST`/`GET`/`PATCH /v1/users` y `POST /v1/users/:id/activation-code`: el `admin_empresa` invita a un `responsable`, un `delegado`, un `auditor` u otro `admin_empresa`; la cuenta nace `pending` y **el código de activación solo sale por correo** (MD-190, SEG-75): el alta y el reenvío (`POST /v1/users/:id/activation-code`, `200 { invitation }`) responden `invitation { delivery_status: 'sent' | 'failed', expires_at }`, nunca el código. `InvitationDelivery` y la plantilla viven en `team/application/invitation/` y envían **después del commit** con el puerto `Mailer` (un solo intento, sin cola ni estado guardado: `DT-90`); un mensaje marcado `confidential` no se imprime en `LogMailer`, así que con `MAIL_PROVIDER=log` el código no se ve en el log. `TeamUserRepository.invitationContext` lee quién invita y el nombre de la empresa, y las pruebas toman el código del correo capturado (`test/support/equipo.ts`, `claveEnviadaA`). El enlace del correo sale de `PLATFORM_APP_URL` a través de `common/mail/app-url.ts` (`appUrl`/`platformAppUrl`, compartido con la clave de empresa y el aviso de contraseña): solo vale `http(s)`; si es inválida, el correo sale sin enlace y se avisa sin mostrar el valor. `reissueCode` bloquea la fila de la cuenta (`FOR UPDATE`) para que dos reemisiones simultáneas dejen un solo código vigente. **D104:** un `responsable` queda solo en el grupo «Responsables» (se crea si falta; `409 RESPONSIBLES_GROUP_INVALID` si ese nombre lo lidera otro rol); su equipo de delegados no nace con él y lo crea MD-189. `POST /v1/users` lo abre `@Roles('admin_empresa','responsable')`: el responsable solo crea `delegado` en su equipo (`409 RESPONSIBLE_HAS_NO_TEAM` si aún no lo tiene) y `GET` le devuelve solo sus delegados; la regla fina vive en `team-member-placement.ts`. `GET /v1/auth/me` (y `login`, `mfa/verify`, `activate`) añade `group` y, al delegado, `responsible`, leídos por `auth` en su propio repositorio. El reparto por dimensión (`/dimension-owners`, `/responsibles` por control) **se eliminó**; el dueño y el ejecutor de un control salen de `client_control_assignments` (`compliance/infrastructure/shared/control-responsibles.ts`, transitorio, `DT-87`). **El cupo de usuarios ya se aplica** al alta, a la reactivación `inactive`→`active` y al canje de la clave (`common/quota`, SEG-72; `409 USER_LIMIT_REACHED`). **Grupos (MD-189):** `GET`/`POST`/`PATCH /v1/groups` (`groups.controller.ts`, `team-groups.use-cases.ts`, `team-group-placement.ts`); `user_groups.kind` (`group_kind`) con un índice único parcial por líder (un `team` por responsable, `409 TEAM_ALREADY_EXISTS`); el responsable crea su equipo y el administrador el de un responsable; «Responsables» reservado (`GROUP_NAME_TAKEN`, `GROUP_RESERVED`); `PATCH /v1/users/{id}` mueve un delegado (`group_id`, `confirm_unassign`, `409 USER_HAS_ASSIGNMENTS`) bloqueando su fila antes de limpiar ejecutores. Los P2002 se traducen por nombre de restricción (`unique-violation.ts`). Sin construir: baja con aviso (MD-191, `DT-88`), asignación (MD-192), y la interfaz. | `contracts/gestion-usuarios.md` · `modelo/05-usuarios.md` · MD-186, MD-188, MD-190 · DT-87, DT-88, DT-90 · SEG-66, SEG-75 |
| `technical-control` | Componente 3: catálogo de conexiones, activos, comprobar → activar → programar. La **sonda** es un puerto (`ConnectionProbe`) con adaptadores `simulated`, `unavailable` y `runner` (`PROBE_MODE`; `runner` valida una cuenta de nube real a través del trabajador, D58); el proveedor del motor nunca sale. El paso 3 es **provisional** para servidores y bases. Qué conexiones, plataformas, canales, regiones, frecuencias y tipo de activo ofrece cada escenario sale de la **base** (`catalog.*`, D67), no del código. | `contracts/onboarding/conexion-activos/README.md`, `contracts/control-tecnico.md` · D46, D48, D67 · DT-32…DT-36 · D71 |
| `src/runner/` (no es una feature) | **El trabajador del motor de nube** (Prowler, D57): otro entrypoint de la misma imagen (`node dist/src/runner/main.js`). Reclama ejecuciones y validaciones por la API interna `/internal/runner`, asume el rol del cliente con credenciales temporales (STS) y lanza el motor en un contenedor efímero. No importa nada de `src/features` y no tiene acceso a la base. | `arquitectura/control-tecnico/motores/prowler.md` · `skills/backend/add-cloud-engine.md` · D57, D58 · SEG-46, SEG-47 · DT-43 |

> **D96 (2026-10-28).** en `compliance` el `admin_empresa` revisa la evidencia, da el veredicto, crea las exclusiones (nacen aprobadas) y edita o da de baja los controles directo (`PATCH`/`DELETE /v1/controls/{id}`). Se retiraron las evaluaciones del servicio (`/assessments`) y las propuestas de cambio (`/controls/{id}/changes`); sus tablas quedan sin uso. El `funcional` veía solo lo suyo por dimensión (B67, 2026-10-29); **D102 lo reemplazó en MD-186 (2026-11-04)**: `responsable` y `delegado` ven lo que `client_control_assignments` les asigna (`infrastructure/shared/control-responsibles.ts`, `DT-87`) y el módulo `team` solo gestiona las cuentas (`/v1/users`). La migración `20261030000100_remove_consultant` retira de la base el valor `consultor` de `user_role`, `consultant_assignments` (con su trigger, política y enum), los valores `consultor`/`auditor` de `evidence_reviewer_role`, `consultor` y `ready`/`not_ready` de `assessor_role`/`assessment_verdict`, y renombra `evaluations.consultant_assessment` a `verdict_note`; se detiene con un mensaje si algún dato usa un valor que se retira.

**Siembra** (no existe `prisma db seed`): `npm run bootstrap:admin` (empresa interna de Monkey y
primer `admin_monkey` desde `BOOTSTRAP_*`), `npm run reference:load` (regulaciones, marcos ofrecidos,
capacidades automatizadas; idempotente; `reference:verify` solo compara) y `catalog:load` (catálogo SOC 2).

## Convenciones clave

- Respuestas con `ResponseDto` (`{ statusCode, message, data }`), `message` traducido según
  `Accept-Language`. Errores con el mismo sobre más `error.code` (`contracts/conventions.md`), vía
  `src/common/filters/http-exception.filter.ts`.
- Todo endpoint exige sesión por defecto; `@Public()` lo abre y `@Roles(...)` restringe por rol. El
  usuario llega con `@CurrentUser()` (`Principal`), con el rol leído de la base, no del token.
- Acceso a datos por `PrismaService` con `APP_DATABASE_URL`. **Toda consulta a una tabla con RLS va
  dentro de `withScope(scope, tx => …)`**. Las búsquedas previas al tenant (login, canje, refresh)
  usan las funciones `SECURITY DEFINER` de `platform` con `$queryRaw`.
- Schema en `prisma/schema/<catalog|platform|tenant|audit>/*.prisma`, un solo `prisma.config.ts`.
  Migrar con `npx prisma migrate dev` (dev) o `migrate deploy` (staging/prod); ver
  `skills/backend/add-prisma-model.md`.
- **Auditoría atómica (D52, SEG-36):** todo método de repositorio que cambia datos recibe un
  `AuditIntent` que el caso de uso construye y el repositorio escribe con `insertAuditLog(tx, …)` en
  la misma transacción. Si el rastro falla, la acción se revierte. `AuditLogWriter.write` queda solo
  para intentos fallidos.
- Inversión de dependencias con clases abstractas: cada `*.module.ts` registra
  `provide: XRepository, useClass: XPrismaRepository`.
- Tipos en firmas decoradas con `import type` (`isolatedModules` + `emitDecoratorMetadata`).

## Qué NO hacer

- No importar Prisma ni decoradores de Nest dentro de `domain/`.
- No consultar tablas con RLS fuera de `withScope`, ni conectar la app como `postgres`.
- No importar el interior de una feature desde otra: lo compartido va a `common/` o `infrastructure/`.
- No crear un schema Prisma monolítico; usar el archivo del dominio correspondiente.
- No saltarse capas (p. ej. controller llamando directo al repositorio Prisma).
