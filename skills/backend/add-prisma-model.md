---
id: add-prisma-model
name: Agregar o editar un modelo Prisma
description: Cómo agregar/modificar un modelo en el schema Prisma multi-archivo (una base, cuatro schemas de Postgres) y aplicar la migración.
type: recipe
applies_to: backend
---

# Skill: Agregar o editar un modelo Prisma

> Qué entidades deben existir lo dice `skills/product/monkey-compliance-council/references/datos/modelo-datos.md`
> (el plan vigente, ver `CLAUDE.md`). **Cómo** se implementan —Prisma 7, RLS, roles, migraciones—
> lo dice `schema-implementacion.md`, que hay que leer antes de tocar el schema.

Hay **un solo proyecto Prisma** (`prisma.config.ts` en la raíz) sobre **una sola base (`monkey`)**
con **cuatro schemas de Postgres** (decisión D25):

```
prisma/schema/
├── schema.prisma     # solo generator (prisma-client, moduleFormat cjs) + datasource
├── catalog/          # catálogo maestro — lectura libre, escribe solo admin_monkey
├── platform/         # companies, access_keys, users, sessions…
├── tenant/           # onboarding, cumplimiento, control técnico
└── audit/            # audit_logs, compliance_events (append-only)
```

Los antiguos `prisma/central/` y `prisma/tenant/` (una base por cliente) **ya no existen**.

## Pasos

1. Ubicar el archivo del dominio (`prisma/schema/<schema>/<dominio>.prisma`). Si es nuevo, crearlo
   **dentro de `prisma/schema/`** (Prisma solo carga lo que está ahí). Cada modelo lleva
   `@@schema("<schema>")` y `@@map("<tabla_snake_case>")`; cada enum, `@@map("snake_case")`.
2. Respetar las convenciones de `modelo-datos.md`: tablas en plural `snake_case`, PK `id uuid`,
   FK `<tabla_singular>_id` con su índice, sin `ON DELETE CASCADE`, y `tenant_id`/`company_id` en
   toda tabla de cliente.
3. Generar la migración del schema:
   ```bash
   npx prisma migrate dev --name <nombre> --create-only   # revisar el SQL antes de aplicar
   npx prisma migrate dev                                 # aplicar en dev
   ```
4. **RLS, funciones y CHECK van en una migración aparte**, escrita a mano (`--create-only` vacía):
   nunca se mezclan con el cambio de schema en la misma migración (la validación contra la shadow
   falla). Toda tabla nueva de `tenant`/`platform` necesita su política RLS; toda tabla nueva de
   `catalog`, las cuatro políticas de lectura/escritura (`schema-implementacion.md` §5). `npm run test:e2e` (`Backend/test/aislamiento/rls-cobertura`) **falla** si una tabla de cliente queda sin RLS, sin `FORCE`, sin política
   o sin `tenant_id`/`company_id`: corre en el CI ([`seguridad/aislamiento-tenant.md`](../product/monkey-compliance-council/references/seguridad/aislamiento-tenant.md), SEG-05).
5. `npm run prisma:generate` si el paso anterior no regeneró el cliente (`generated/prisma`).
6. Datos iniciales: `prisma/seed/seed-reference.ts` (`npm run reference:load`) para catálogos de referencia y `bootstrap-admin.ts` para el primer administrador, con los valores sensibles desde
   el `.env`, nunca en git.
7. Staging y producción aplican con `npx prisma migrate deploy`, nunca `migrate dev`.

## Restricciones

- No editar migraciones ya aplicadas: se corrige con una nueva.
- Las migraciones asumen tablas vacías cuando agregan columnas `NOT NULL`: en un ambiente con datos,
  escribir el backfill.
- El acceso a datos en runtime es solo por `PrismaService` (`src/infrastructure/database/`), que se
  conecta con `APP_DATABASE_URL` (rol `monkey_app`, sujeto a RLS) y expone `withScope()`.
