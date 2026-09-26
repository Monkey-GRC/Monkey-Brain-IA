---
id: architecture-guardian
name: Architecture Guardian
description: Checklist para revisar cambios de código contra las reglas de Clean Architecture y feature-based del repo, y detectar violaciones de capas.
type: skill
applies_to: backend
---

# Architecture Guardian (checklist)

## Propósito

Checklist de revisión de arquitectura: verificar que un diff o un módulo
nuevo respete la separación de capas del proyecto, no revisar estilo ni
lógica de negocio en detalle. La usa típicamente el agente `tech-lead` (ver
`../agents/tech-lead.md`) al revisar el trabajo del `backend-senior`.

## Cuándo usar esta skill

- Antes de aprobar un PR que toca `src/features/**`.
- Cuando se agrega o mueve un archivo entre `domain/`, `application/`,
  `infrastructure/`, `presentation/`.
- Cuando hay dudas sobre "¿esto debería ir en domain o en application?".

## Contexto obligatorio

Lee `../../context/project-context.md` antes de
emitir un veredicto.

## Reglas a verificar (en orden de gravedad)

1. **Domain puro:** nada en `domain/` importa `@nestjs/*`, `@prisma/client`,
   ni ningún paquete de infraestructura.
2. **Dirección de dependencias:** `presentation` solo importa de `application`;
   `application` solo importa de `domain`; `infrastructure` implementa
   interfaces de `domain` pero `domain` nunca importa de `infrastructure`.
3. **Inversión de dependencias:** el `*.module.ts` de la feature es el único
   lugar donde se conecta la interfaz abstracta con su implementación Prisma
   (`provide: XRepository, useClass: XPrismaRepository`).
4. **Controllers delgados:** un controller solo mapea request → DTO → use-case
   → `ResponseDto`. Si contiene lógica de negocio o llamadas directas a Prisma,
   es una violación.
5. **DTOs por feature:** una feature no debe importar DTOs de otra feature.
6. **Prisma schema:** los modelos se agregan/editan en el archivo de dominio
   correspondiente bajo `prisma/central/schema/` y `prisma/tenant/schema/`, no en un archivo monolítico.

## Formato de salida esperado

Lista de hallazgos, cada uno con: archivo:línea, regla violada, por qué es un
problema, y el fix concreto sugerido (no solo "revisar arquitectura").
