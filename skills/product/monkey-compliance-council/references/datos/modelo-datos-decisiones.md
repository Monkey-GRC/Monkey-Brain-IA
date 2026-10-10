# Modelo de datos — registro de decisiones

Bitácora de las decisiones que cerraron el modelo relacional, desde el 15 de
septiembre de 2026, con la fuente y el razonamiento de cada una.

Esto no es el modelo: el modelo está en **`modelo-datos.md`**, y ahí se lee qué hay que
construir. Este archivo existe para responder *"¿por qué se decidió así?"* sin volver a
discutirlo, y para que si alguna decisión resulta equivocada se pueda revisar sabiendo en
qué se apoyaba.

Lo que sigue abierto está en **`modelo-datos-pendientes.md`**.

> Este contenido estuvo hasta el 16 de septiembre de 2026 en una sección "§8" de
> `modelo-datos.md`. Si un ticket de Jira o un comentario viejo apunta a "§8", se refiere
> a este archivo — no a la §8 actual de `modelo-datos.md`, que es Control Técnico.

---

## Las decisiones

Aquí viven las decisiones **ya cerradas** del modelo relacional, con su fuente y su
razonamiento. Las que siguen abiertas **no están aquí**: viven en
`modelo-datos-pendientes.md` y se numeran P1, P2, P3.

La numeración A/B/C/D es histórica y tiene huecos (no existen B3, B5 ni D15-D22): son
preguntas que se plantearon y se descartaron o se fusionaron con otras antes de cerrarse.
Un hueco no es una decisión pendiente.
Cada una se resolvió con la opción que (a) tiene respaldo en una fuente del comité,
(b) no obliga a rehacer lo ya construido, y (c) sigue el flujo real de la aplicación.
Las tres que quedan abiertas están al final: son las que nadie puede decidir por el
comité.

**Estas decisiones ya no son pendientes.** Se construye sobre ellas. Si alguna resulta
equivocada, se corrige con el comité — pero no se re-abre el debate en cada sprint.

## Dónde está cada decisión

El registro está partido por épocas en `decisiones/`. **Busca el ID en el índice y abre solo ese archivo** (la columna Archivo es el prefijo `NN` del nombre). Los IDs no cambian.

| Archivo | Contiene |
|---|---|
| [`decisiones/01-base-y-calculo.md`](decisiones/01-base-y-calculo.md) | **A–D y D23–D25** — Estructura, cálculo, material fuente y aprovisionamiento (septiembre 2026). |
| [`decisiones/02-schema-y-catalogo.md`](decisiones/02-schema-y-catalogo.md) | **D26–D42** — Revisión de migraciones, enums, RLS, siembra y clonado del catálogo, audit trail, despliegue de migraciones. |
| [`decisiones/03-onboarding.md`](decisiones/03-onboarding.md) | **D43–D47** — Clave de acceso y los 3 componentes del onboarding; el marco se contrata al registrar. |
| [`decisiones/04-sonda-y-correcciones.md`](decisiones/04-sonda-y-correcciones.md) | **D48–D52** — Paso 3 provisional contra la sonda real, pool de conexiones, correcciones del comité, auditoría atómica. |
| [`decisiones/05-control-tecnico-y-nube.md`](decisiones/05-control-tecnico-y-nube.md) | **D53–D61** — Conexión con la nube, sonda de servidores, trabajador del motor de nube y descubrimiento de activos. |
| [`decisiones/06-cumplimiento-y-roles.md`](decisiones/06-cumplimiento-y-roles.md) | **D62–D66** — Cómo se cuenta el cumplimiento, el auditor, los cinco roles, controles propios y MFA. |

### Índice

| ID | Decisión | Archivo |
|---|---|---|
| A1 | El responsable de una evidencia es cargo *y* persona, en planos distintos | 01 |
| A2 | Un activo puede pertenecer a varios servicios (`N:M`) | 01 |
| A3 | La exclusión la propone el consultor y la aprueba el cliente; vence con el periodo de evaluación | 01 |
| A4 | El catálogo maestro se versiona, y cada evaluación guarda contra qué versión se midió | 01 |
| B1 | No se pondera por nivel de riesgo | 01 |
| B2 | El requisito es binario, igual que el control | 01 |
| B6 | La regla del schedule la editan `admin_monkey` y `admin_empresa` | 01 |
| C1 | La evidencia es válida si cae dentro del periodo de evaluación | 01 |
| D2 | Peso lineal, y punto (en el MVP) | 01 |
| D3 | `client_controls` es una entidad propia | 01 |
| D4 | Hay un cuarto tipo: `technical_manual` | 01 |
| D5 | Se mantienen las 5 dimensiones | 01 |
| D6 | El mapeo de checks es por política | 01 |
| D7 | Vulnerabilidades: solo insumo en el MVP | 01 |
| D8 | El muestreo se modela como dato, no como texto | 01 |
| D9 | Monkey cura el catálogo central; la matriz RBAC aplica al escenario del cliente | 01 |
| D10 | `regulations` es una entidad propia y no se puntúa | 01 |
| D11 | `csocs` y `cuecs` son entidades propias, marcadas como no medibles por Monkey | 01 |
| D12 | Se guarda el mapeo completo, en una tabla `check_mappings` (`check_id`, `framework_code`, `framework_version`, `requirem… | 01 |
| D13 | La nube se reporta como cobertura pendiente | 01 |
| D1 | El 40/60 de la matriz ya no bloquea nada: el comité especificó la fórmula completa | 01 |
| A4 | El comité aceptó la recomendación, con dos matices que la completan | 01 |
| D14 | Es híbrido: el cliente elige, no Monkey | 01 |
| D23 | No es un 4º componente del onboarding | 01 |
| D24 | Monkey Admin y Monkey Platform son dos aplicaciones distintas; el registro del tenant define nombre y aislamiento | 01 |
| D25 | Una sola base de datos por defecto, no dos planos separados | 01 |
| D26 | Tipos enum en `snake_case` | 02 |
| D27 | Qué dice una evaluación, y por qué es inmutable de verdad | 02 |
| D28 | Riesgos y causas: plantilla en el catálogo, copia por cliente | 02 |
| D29 | Búsquedas previas al tenant: funciones `SECURITY DEFINER`, email único global | 02 |
| D30 | Cargos, clonado de evidencia y de tests (cierra P4) | 02 |
| D31 | RLS también en `catalog` (escritura), `companies`, `access_keys` y `audit_logs` | 02 |
| D32 | Las `N:M` de dominios de monitoreo, explícitas | 02 |
| D33 | Riesgos: categoría de 11 valores y evaluación 5×5 que hace el cliente | 02 |
| D34 | Los enums que estaban como texto, cerrados | 02 |
| D35 | Siembra del catálogo de SOC 2 (MD-65): dominio del control, publicador opcional y estrategia | 02 |
| D36 | Controles del cliente completos, clonado y plantillas de evidencia | 02 |
| D37 | El MVP contempla solo SOC 2 | 02 |
| D38 | El dato real manda: cómo se siembra y qué se encontró | 02 |
| D39 | Dimensiones por control y políticas del catálogo (cierra P10) | 02 |
| D40 | Reglas del clonado del catálogo al elegir marco (MD-80) | 02 |
| D41 | El audit trail es inmutable en la base de datos y se retiene 7 años (MD-92) | 02 |
| D42 | Cómo viaja una migración a staging (MD-91) | 02 |
| D43 | La clave de acceso se canjea una sola vez, y solo con el correo administrativo | 03 |
| D44 | Componente 1 del onboarding: huecos del contrato resueltos por desarrollo | 03 |
| D45 | Componente 2 del onboarding: ajustes del schema y huecos resueltos por desarrollo | 03 |
| D46 | Componente 3 del onboarding: huecos cerrados por desarrollo | 03 |
| D47 | El marco se contrata al registrar la empresa (revierte el veto de §6.1) | 03 |
| D48 | Paso 3 del control técnico: lo verificado contra la sonda real y por qué el flujo actual es provisional | 04 |
| D49 | Las peticiones esperan hasta 10 s por una conexión del pool | 04 |
| D50 | Todos los marcos se ofrecen, solo SOC 2 se contrata; cada marco con sus categorías | 04 |
| D51 | Correcciones al Componente 2 y a la activación de cuenta | 04 |
| D52 | La auditoría se escribe en la misma transacción que la acción (cierra DT-28, SEG-36) | 04 |
| D53 | Conexión con la nube: alcance, activo, regiones, canales y retención | 05 |
| D54 | La sonda de servidores: un manager, un grupo por cliente, agente pre-registrado por Monkey (responde P12.2; 2026-10-07) | 05 |
| D55 | Entorno de desarrollo del control técnico: motor de nube y manager en la VPS | 05 |
| D56 | El control técnico de la nube en el modelo: recurso hijo, procedencia del mapeo y checks sin filas | 05 |
| D57 | Quién ejecuta el motor de nube: un trabajador aislado | 05 |
| D58 | El flujo de conexión de una cuenta de nube: validación real a través del trabajador | 05 |
| D59 | La conexión descubre los activos de la cuenta y los muestra al cliente | 05 |
| D60 | Se retira el scope declarado («cuántos tienes») y el servicio muestra sus conexiones | 05 |
| D61 | Cada recurso descubierto es un activo del cliente, y el servicio elige cuáles son suyos | 05 |
| D62 | El cumplimiento se cuenta: dimensión → control → categoría → marco | 06 |
| D63 | El auditor es un rol aparte | 06 |
| D64 | Hay cinco roles: el consultor prepara, el auditor certifica | 06 |
| D65 | Controles propios y cambios de controles con aprobación del consultor (cierra P8) | 06 |
| D66 | MFA obligatoria para los 5 roles | 06 |
