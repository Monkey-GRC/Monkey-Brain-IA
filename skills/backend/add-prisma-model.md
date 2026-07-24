---
id: add-prisma-model
name: Agregar o editar un modelo Prisma
description: Cómo agregar/modificar un modelo en el schema Prisma multi-archivo del repo y aplicar la migración.
type: skill
applies_to: backend
---

# Skill: Agregar o editar un modelo Prisma

Este repo usa **schema Prisma multi-archivo** bajo `prisma/schema/`:
`client.prisma`, `control.prisma`, `reason.prisma`, `risk.prisma`,
`template.prisma`, `user.prisma`, más `schema.prisma` (datasource/generator) y
`prisma.config.ts` en la raíz (config estilo Prisma 7).

## Pasos

1. Identificar el archivo de dominio correcto en `prisma/schema/` (uno por
   entidad). Si el modelo es nuevo y no calza en ninguno existente, crear un
   archivo nuevo `prisma/schema/<dominio>.prisma` en vez de agregarlo a
   `schema.prisma`.

2. Definir/editar el `model` con sus campos, relaciones (`@relation`) y enums
   si aplica (los enums existentes: `RiskLevel`, `Role`).

3. Generar y aplicar la migración:
   ```bash
   npx prisma migrate dev --name <descripcion-corta>
   ```

4. Regenerar el cliente Prisma si el paso anterior no lo hizo automáticamente:
   ```bash
   npx prisma generate
   ```

5. Si el modelo requiere datos iniciales, agregar el seed correspondiente en
   `src/infrastructure/database/seeds/`.

## Restricciones

- No mezclar múltiples dominios en un mismo archivo `.prisma`.
- No editar migraciones ya aplicadas en `prisma/migrations/`; generar una
  migración nueva para cualquier cambio.
- Los adaptadores configurados son `@prisma/adapter-pg` y
  `@prisma/adapter-planetscale` — no asumir un cliente Prisma "clásico" sin
  adapter al escribir código que instancia `PrismaClient` fuera de
  `PrismaService`.
