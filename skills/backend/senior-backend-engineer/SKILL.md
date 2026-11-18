---
name: senior-backend-engineer
description: >-
  Úsala SIEMPRE antes de escribir, modificar o revisar código del repo Backend de Monkey
  (NestJS, Clean Architecture por features, Prisma, Postgres con RLS, runner del motor de nube):
  nuevas features, endpoints, casos de uso, repositorios, migraciones, errores, auditoría, pruebas
  o refactors. Fija cómo pensar como ingeniero senior (código limpio, escalable, por capas), qué
  leer primero, cómo se organizan las carpetas y cuándo se considera terminado, y enruta a las
  recetas de skills/backend/.
---

# Ingeniero backend senior — punto de partida

Esta skill fija **cómo se decide y se construye** en `Backend`. Las recetas paso a paso viven en los otros archivos de
`skills/backend/` (un nivel arriba de esta carpeta); aquí no se repiten, se enlazan. El código manda: si algo de aquí difiere de `src/`, se corrige el archivo.

## 1. Antes de escribir una línea

1. **Producto primero.** Si la tarea cambia lo que ve un usuario, un endpoint, el modelo o una prioridad, ejecuta `/monkey-compliance-council`
   y sigue su ruteo (`CLAUDE.md`). Trabajo mecánico (typo, bug ya diagnosticado) no lo necesita.
2. **Contrato primero.** `contracts/conventions.md`, `contracts/enums.md` y `contracts/<módulo>.md`. Si el endpoint no está,
   se acuerda antes de construir. Opciones de enum: gana el Excel del comité; nombre de campo: gana `modelo-datos.md`.
3. **Modelo y decisiones.** Solo el módulo que toques en `datos/modelo/`. Si dependes de una pregunta abierta (`P-n`), **pregunta, no resuelvas**.
4. **Lee el código vecino.** `src/features/auth` es la plantilla de las cuatro capas; `companies` la de CRUD paginado; `compliance` la de una feature grande.
5. **Seguridad.** [`seguridad/`](../../product/monkey-compliance-council/references/seguridad/README.md): si el cambio crea un requisito nuevo, añade su `SEG-n`.

## 2. El mapa del repo

```
Backend/
├── src/
│   ├── features/<nombre>/{domain,application,infrastructure,presentation}/  + <nombre>.module.ts
│   ├── common/          lo compartido y puro: sobre de respuesta, DomainError, guards, decoradores, TenantScope, puertos
│   ├── infrastructure/  implementaciones globales: PrismaService (withScope), audit, mail, security, storage
│   └── runner/          el trabajador del motor de nube (otro entrypoint; no importa de features)
├── prisma/{schema/<catalog|platform|tenant|audit>/, migrations/, seed/}
├── i18n/{es,en}/        claves de mensajes y errores
├── test/                e2e contra un Postgres desechable
└── deploy/, scripts/
```

Una feature crece **por subfuncionalidad dentro de cada capa** (`<capa>/<sub>/`), no por carpetas planas de más de ~9 archivos.
Nombres en inglés, `kebab-case`, `<sujeto>.<rol>.ts`. Detalle: `../add-feature.md`.

## 3. Cómo se piensa (reglas de criterio)

| Principio | Lo que significa aquí |
|---|---|
| **Dependencias hacia adentro** | `presentation → application → domain`; `infrastructure → domain`. El dominio no importa Nest, Prisma ni nada externo. |
| **Una razón para cambiar** | Un caso de uso por operación. El controller solo traduce (request → DTO → caso de uso → mapper). La regla de negocio vive en el dominio o el caso de uso, nunca en el controller ni en el repositorio Prisma. |
| **Depender de abstracciones** | Repositorios y puertos abstractos en `domain/`; el `*.module.ts` es el único lugar donde se enlaza con la implementación. |
| **Las features no se conocen** | Ninguna importa el interior de otra. Lo compartido sube a `common/` o `infrastructure/`; si necesitas datos de otra, pásalos como parámetro o por un puerto. |
| **El aislamiento es de la base, no del código** | Toda consulta a tabla con RLS va dentro de `prisma.withScope(scope, …)`. Un `WHERE tenant_id` a mano no sustituye a RLS. La app nunca usa `DATABASE_URL` (superusuario). |
| **Auditar es parte del cambio** | Todo método del repositorio que cambia datos recibe un `AuditIntent` y lo escribe en la misma transacción (SEG-36). |
| **Fallar con nombre** | Errores de negocio = `DomainError` con el `error.code` del contrato y clave i18n en `es` y `en`. Nunca `HttpException` ni `Error` genérico; nunca tragar un error en silencio. |
| **Validar en el borde** | DTOs con `class-validator` y los nombres snake_case del contrato; el `ValidationPipe` rechaza lo que sobra. Confía en tipos dentro, no fuera. |
| **Secretos fuera** | Nada de llaves, tokens ni contraseñas en código, logs, `after_state`, repos ni chats. El proveedor de los motores nunca sale en texto de cliente. |
| **Cambios pequeños y reversibles** | Migraciones aditivas y con respaldo (D42); un PR, un propósito; si cierras un `P-n`, `DT-n`, `D-n` o `SEG-n`, se actualiza en el mismo PR. |
| **Atajo = deuda registrada** | Si tomas un atajo, va a `deuda-tecnica/` (`DT-n`) con qué lo cierra. Sin eso, no se toma. |

## 4. Flujo de trabajo

1. Entiende el contrato y el modelo → 2. diseña las capas (qué entidad, qué puerto, qué caso de uso) → 3. dominio y casos de uso con sus pruebas →
4. repositorio Prisma con `withScope` y auditoría → 5. controller, mapper, Swagger → 6. módulo e i18n → 7. pruebas e2e (camino feliz, 401, 403, 422,
errores de negocio, aislamiento entre empresas) → 8. cierra la documentación afectada.

Recetas: nueva feature → `../feature-builder.md` + `../add-feature.md` · tabla o columna → `../add-prisma-model.md` · error con clave → `../add-i18n-error.md` ·
sonda (Wazuh) → `../add-wazuh-integration.md` · motor de nube (Prowler) → `../add-cloud-engine.md` · revisión de capas → `../architecture-guardian.md`.

## 5. Anti-patrones que se rechazan

- Lógica de negocio en controllers, mappers o repositorios; queries a Prisma desde un caso de uso.
- Una feature que importa DTOs, entidades o servicios de otra.
- `any`, `as unknown as`, `// @ts-ignore` o `eslint-disable` para callar un problema en vez de resolverlo.
- Devolver la entidad o la fila de Prisma tal cual al cliente: siempre pasa por el mapper al JSON del contrato.
- Listas de opciones o textos al usuario hardcodeados: salen de `catalog.*`, de `enums.md` o de i18n.
- Funciones largas o con muchos flags booleanos; nombres que no dicen qué hacen; comentarios que cuentan *qué* en vez de *por qué*.
- Pruebas que dependen de la base compartida de dev o de datos reales.

## 6. Definición de terminado

- [ ] Pruebas de **lo que tocaste** en verde: lo que imprime `skills/process/monkey-dev-flow/scripts/affected-tests.py --repo backend` (tipos, lint, unitarias relacionadas y e2e de las features afectadas). La suite completa la corre el CI del PR, no tú (MD-216).
- [ ] Contrato, `enums.md`, i18n (`es` y `en`) y Swagger al día con el código.
- [ ] **Endpoint nuevo o respuesta cambiada → Swagger completo.** `src/common/swagger/api-docs.spec.ts` cuenta las rutas
  públicas (actualiza el número esperado, con un comentario del ticket) y exige `description` en cada propiedad de cada
  `@ApiProperty`/`@ApiPropertyOptional` (respuestas, DTOs y queries). Lo corre `npx jest`, que va siempre completo (~6 s). El CI
  de MD-195 cayó por esto.
- [ ] Revisado con `../architecture-guardian.md`; sin carpetas con más de ~9 archivos sueltos.
- [ ] `SEG-n`, `DT-n`, `P-n` y `D-n` afectados actualizados en el mismo cambio.
- [ ] Nada de lo que ve el cliente nombra a Wazuh ni a Prowler.
