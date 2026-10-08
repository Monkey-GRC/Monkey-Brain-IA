# Datos — el modelo relacional

Todo lo que dice **qué tablas hay, cómo se relacionan, por qué son así y cómo se implementan en el Backend**. Es la referencia
obligada antes de tocar el schema o cualquier cálculo de cumplimiento (regla de `CLAUDE.md`).

| Archivo | Qué responde | Cuándo se lee |
|---|---|---|
| [`modelo-datos.md`](modelo-datos.md) | **El qué:** entidades, PK/FK, cardinalidades, dimensiones, tests, evidencias, exclusiones y cómo se calcula el cumplimiento, **ordenado por módulos** | Antes de construir cualquier pantalla, endpoint o cálculo |
| [`schema-implementacion.md`](schema-implementacion.md) | **El cómo:** Prisma 7, RLS, roles, variables de entorno, migraciones y despliegue | Antes de tocar el schema, una migración o el `.env` |
| [`modelo-datos-decisiones.md`](modelo-datos-decisiones.md) | **El porqué** de cada decisión ya cerrada (`D-n`), con su fuente | Si alguien quiere reabrir algo; no para construir |
| [`modelo-datos-pendientes.md`](modelo-datos-pendientes.md) | Lo que **todavía no está decidido** y solo el comité puede responder (`P-n`) | Antes de construir algo que dependa de una; si sigue ahí, se pregunta, no se resuelve solo |

Por encima de todo están los documentos del comité en `assets/`: si un `.md` y el documento fuente se contradicen, gana el documento
(ver §0 de `modelo-datos.md`). Dos reglas estructurales que no se violan: el **control es atómico e independiente del marco**, y el
**cumplimiento de un marco se deriva**, nunca se almacena.

Lo parchado por desarrollo no vive aquí sino en [`../deuda-tecnica/`](../deuda-tecnica/README.md); los requisitos de seguridad, en
[`../seguridad/`](../seguridad/README.md).

## Índice de `modelo-datos.md` (por sección)

Las citas «§7.4» de todo el Brain apuntan a estas secciones. **Los números no se cambian.**

- 0. Fuentes
- 1. Glosario
- 2. Las 5 dimensiones: el eje transversal
- 3. Catálogo maestro
  - 3.1 El marco y sus requisitos
  - 3.2 El control y su desacople del marco
  - 3.3 Tests, checks y plan de testeo
  - 3.4 Riesgos y causas (catálogo base)
  - 3.5 Versionado del catálogo y qué se clona
- 4. Módulo Monkey Admin — registro del tenant
  - 4.1 Las tablas
  - 4.2 El flujo de registro
  - 4.3 Aislamiento de datos (multi-tenancy)
  - 4.4 Variables de sesión y reglas de integridad transversales
- 5. Módulo Usuarios
  - 5.1 Los 4 roles
  - 5.2 Las tablas
  - 5.3 Políticas de seguridad de la plataforma
  - 5.4 Responsables organizacionales
  - 5.5 Matriz de permisos
  - 5.6 Cómo el modelo de usuarios sostiene SOC 2
- 6. Módulo Onboarding
  - 6.1 Componente 1 — Contexto Organizacional
  - 6.2 Componente 2 — Contexto del Servicio
  - 6.3 Componente 3 — Control Técnico
- 7. Módulo Cumplimiento
  - 7.1 El control del cliente
  - 7.2 Riesgos del cliente y sus indicadores
  - 7.3 Evidencias
  - 7.4 Evaluaciones y hallazgos (el histórico)
  - 7.5 La IA y el auditor
- 8. Módulo Control Técnico — la operación continua
- 9. Cómo se calcula el cumplimiento
- 10. Diagrama global

## Índice de `schema-implementacion.md`

- 1. Arquitectura
- 2. Estructura de Prisma
- 3. Prisma 7: lo que no es como en las versiones anteriores
- 4. Bases, roles y variables de entorno
- 5. RLS
- 6. Ubicaciones ambiguas del ER, resueltas
- 7. Convenciones de migración
- 8. Infraestructura y despliegue
- 9. Lo que sigue pendiente (operativo, no del modelo)
- 10. Migraciones, en orden
- 11. Siembra del catálogo maestro de SOC 2
- 12. El clonado del catálogo (MD-80)
- 13. Primer arranque de staging y migración automática (MD-91)

## Índice de decisiones (`modelo-datos-decisiones.md`)

D1 a D22 están agrupadas en bloques (A estructura, B y C el cálculo, D lo que abrió el material fuente, más lo cerrado el 16 y el
20 de septiembre) con una tabla cada uno; de D23 en adelante cada decisión tiene su propia sección.

  - Bloque A — estructura
  - Bloque B y C — el cálculo
  - Bloque D — lo que abrió el material fuente
  - Cerrado por el ejemplo de fórmula (entregado el 16 de septiembre, por la tarde)
  - Cerrado el 20 de septiembre
- D23 (Cumplimiento) · No es un 4º componente del onboarding
- D24 (aprovisionamiento) · Monkey Admin y Monkey Platform son dos aplicaciones distintas; el registro del tenant define nombre y aislamiento
- D25 (aprovisionamiento/simplificación MVP) · Una sola base de datos por defecto, no dos planos separados
- Revisión de migraciones contra el modelo (2026-09-29) · D26 a D32
- D26 · Tipos enum en `snake_case`
- D27 · Qué dice una evaluación, y por qué es inmutable de verdad
- D28 · Riesgos y causas: plantilla en el catálogo, copia por cliente
- D29 · Búsquedas previas al tenant: funciones `SECURITY DEFINER`, email único global
- D30 · Cargos, clonado de evidencia y de tests (cierra P4)
- D31 · RLS también en `catalog` (escritura), `companies`, `access_keys` y `audit_logs`
- D32 · Las `N:M` de dominios de monitoreo, explícitas
- D33 · Riesgos: categoría de 11 valores y evaluación 5×5 que hace el cliente
- D34 · Los enums que estaban como texto, cerrados
- D35 · Siembra del catálogo de SOC 2 (MD-65): dominio del control, publicador opcional y estrategia
- D36 · Controles del cliente completos, clonado y plantillas de evidencia
- D37 · El MVP contempla solo SOC 2
- D38 · El dato real manda: cómo se siembra y qué se encontró
- D39 · Dimensiones por control y políticas del catálogo (cierra P10)
- D40 · Reglas del clonado del catálogo al elegir marco (MD-80)
- D41 · El audit trail es inmutable en la base de datos y se retiene 7 años (MD-92)
- D42 · Cómo viaja una migración a staging (MD-91)
- D43 · La clave de acceso se canjea una sola vez, y solo con el correo administrativo
- D44 · Componente 1 del onboarding: huecos del contrato resueltos por desarrollo
- D45 · Componente 2 del onboarding: ajustes del schema y huecos resueltos por desarrollo
- D46 · Componente 3 del onboarding: huecos cerrados por desarrollo
- D47 · El marco se contrata al registrar la empresa (revierte el veto de §6.1)
- D48 · Paso 3 del control técnico: lo verificado contra la sonda real y por qué el flujo actual es provisional
- D49 · Las peticiones esperan hasta 10 s por una conexión del pool
- D50 · Todos los marcos se ofrecen, solo SOC 2 se contrata; cada marco con sus categorías
- D51 · Correcciones al Componente 2 y a la activación de cuenta (2026-10-05)
- D52 · La auditoría se escribe en la misma transacción que la acción (cierra DT-28, SEG-36)
- D53 · Conexión con la nube: alcance, activo, regiones, canales y retención
- D54 · La sonda de servidores: un manager, un grupo por cliente, agente pre-registrado
- D55 · Entorno de desarrollo del control técnico: motor de nube y manager en la VPS
- D56 · El control técnico de la nube en el modelo: recurso hijo, procedencia del mapeo y checks sin filas
