---
id: add-prisma-model
name: Agregar o editar un modelo Prisma
description: Cómo agregar/modificar un modelo en los schemas Prisma multi-archivo del repo y aplicar la migración.
type: skill
applies_to: backend
---

# Skill: Agregar o editar un modelo Prisma

> ⚠️ **El schema actual del `Backend` no es la referencia de diseño.** El plan vigente es
> `skills/product/monkey-compliance-council/references/modelo-datos.md` (ver `CLAUDE.md`).
> Esta skill describe cómo se toca el schema **como está hoy**; qué entidades deben existir
> lo dice el modelo.

El repo tiene **dos proyectos Prisma separados**, cada uno con schema multi-archivo:

| Proyecto | Schema | Config | Cliente generado |
|---|---|---|---|
| central | `prisma/central/schema/` | `prisma.config.central.ts` | `generated/prisma-central` |
| tenant | `prisma/tenant/schema/` | `prisma.config.tenant.ts` | `generated/prisma-tenant` |

- **central**: `asset`, `cis-check-translation`, `client`, `control`, `manual-check`, `reason`,
  `risk`, `tenant-identifier-directory`, `user`, más `schema.prisma` (datasource/generator).
- **tenant**: los mismos menos `client`, `cis-check-translation` y `tenant-identifier-directory`,
  más `company-profile`.

No existe `prisma/schema/` ni un `prisma.config.ts` en la raíz. Las URLs no están en el schema:
las inyecta cada config desde `CENTRAL_DATABASE_URL` y `TENANT_MIGRATION_DATABASE_URL`.

## Pasos

1. Decidir **a qué proyecto(s) aplica** el cambio. Muchos modelos viven en los dos y hay que
   tocarlos en ambos sitios y migrar por separado.

2. Identificar el archivo de dominio correcto (uno por entidad). Si el modelo es nuevo y no
   calza en ninguno, crear `prisma/<central|tenant>/schema/<dominio>.prisma` en vez de
   agregarlo a `schema.prisma`.

3. Definir/editar el `model` con sus campos, relaciones (`@relation`) y enums si aplica.
   Enums existentes hoy: `AssetSource`, `AssetStatus`, `AssetType`, `BusinessType`,
   `ChecklistOs`, `ClientDocumentType`, `ClientProvisioningStatus`, `ControlDimension`,
   `ControlType`, `ManualCheckStatus`, `RiskLevel`, `Role`.

4. Generar y aplicar la migración con el config correspondiente:
   ```bash
   npm run prisma:migrate:central   # prisma migrate dev --config prisma.config.central.ts
   npm run prisma:migrate:tenant
   ```
   `npx prisma migrate dev` a secas **no funciona**: sin `--config` no resuelve ningún schema.

5. Regenerar el cliente si el paso anterior no lo hizo:
   ```bash
   npm run prisma:generate        # central + tenant
   ```

6. Si el modelo requiere datos iniciales, agregar el seed en
   `src/infrastructure/database/seeds/` y encadenarlo desde `central-seed.ts`.

7. Si el cambio aplica a tenants ya aprovisionados, propagarlo con
   `npm run migrate:tenants:all` (`scripts/migrate-all-tenants.ts`).

## Restricciones

- No mezclar múltiples dominios en un mismo archivo `.prisma`.
- No editar migraciones ya aplicadas (`prisma/central/migrations/`,
  `prisma/tenant/migrations/`); generar una migración nueva.
- Los adaptadores configurados son `@prisma/adapter-pg` y `@prisma/adapter-planetscale` — no
  asumir un cliente Prisma "clásico" sin adapter. El acceso a la base central va por
  `CentralPrismaService` (`src/infrastructure/database/central-prisma.service.ts`); el de cada
  tenant se resuelve con `TenantConnectionManagerService` y `TenantPrismaClientFactory`
  (`src/infrastructure/tenancy/`). **No existe una clase `PrismaService`.**
- Excepción documentada: `checklist` no usa Prisma. Lee la base externa `prueba_wazuh` con un
  `Pool` de `pg` directo
  (`src/features/checklist/infrastructure/repositories/cis-check.pg.repository.ts`).
