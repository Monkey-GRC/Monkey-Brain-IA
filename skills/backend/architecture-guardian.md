---
id: architecture-guardian
name: Architecture Guardian
description: Checklist para revisar cambios de código contra las reglas de Clean Architecture y feature-based del repo, y detectar violaciones de capas.
type: recipe
applies_to: backend
---

# Architecture Guardian (checklist)

## Propósito

Checklist de revisión de arquitectura: verificar que un diff o un módulo
nuevo respete la separación de capas del proyecto, no revisar estilo ni
lógica de negocio en detalle. La usa típicamente el agente `tech-lead` (ver
`../../agents/tech-lead.md`) al revisar el trabajo del `backend-senior`.
La referencia de cómo se ve una feature correcta es `src/features/auth/`.

## Cuándo usar esta skill

- Antes de aprobar un PR que toca `src/features/**`, `src/common/**` o `src/infrastructure/**`.
- Cuando se agrega o mueve un archivo entre `domain/`, `application/`,
  `infrastructure/`, `presentation/`.
- Cuando hay dudas sobre "¿esto debería ir en domain o en application?".

## Contexto obligatorio

Lee `../../context/backend.md` antes de
emitir un veredicto.

## Reglas a verificar (en orden de gravedad)

1. **Aislamiento por tenant:** ninguna consulta a una tabla con RLS se ejecuta fuera de
   `prisma.withScope(...)`, y nadie se conecta con `DATABASE_URL` (superusuario) en runtime. Un
   `WHERE tenant_id = ?` a mano no reemplaza a RLS (`modelo-datos.md` §4.3).
2. **Domain puro:** nada en `domain/` importa `@nestjs/*`, `@prisma/*`, `generated/prisma` ni
   ningún paquete de infraestructura.
3. **Dirección de dependencias:** `presentation` solo importa de `application`;
   `application` solo importa de `domain` (y de `src/common/`); `infrastructure` implementa
   interfaces de `domain` pero `domain` nunca importa de `infrastructure`.
4. **Sin features cruzadas:** una feature no importa archivos de otra. Lo compartido vive en
   `src/common/` (tipos, puertos, decoradores) o `src/infrastructure/` (implementaciones globales).
5. **Inversión de dependencias:** el `*.module.ts` de la feature es el único
   lugar donde se conecta la abstracción con su implementación
   (`provide: XRepository, useClass: XPrismaRepository`).
6. **Controllers delgados:** un controller solo mapea request → DTO → caso de uso → mapper →
   `ResponseDto`. Si contiene lógica de negocio o llamadas directas a Prisma, es una violación.
7. **Errores:** los casos de uso lanzan `DomainError` con el código del contrato; no
   `HttpException` ni `Error` genérico.
8. **DTOs por feature:** una feature no importa DTOs de otra feature.
9. **Prisma schema:** los modelos se agregan en el archivo de su dominio bajo
   `prisma/schema/<catalog|platform|tenant|audit>/`, nunca en un archivo monolítico.

10. **Carpetas legibles:** ninguna carpeta de código con más de ~9 archivos sueltos. Si una feature crece, se
    agrupa por subfuncionalidad dentro de cada capa (`<capa>/<sub>/`, ver `add-feature.md`); nunca se
    mezclan archivos de varias subfuncionalidades en una misma carpeta.

## Formato de salida esperado

Lista de hallazgos, cada uno con: archivo:línea, regla violada, por qué es un
problema, y el fix concreto sugerido (no solo "revisar arquitectura").
