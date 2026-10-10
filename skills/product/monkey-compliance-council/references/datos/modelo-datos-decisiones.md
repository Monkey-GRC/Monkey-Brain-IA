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

### Bloque A — estructura

**A1 · El responsable de una evidencia es cargo *y* persona, en planos distintos.**
El modelo de usuarios lo zanja: existe la tabla `user_control_assignments`, el rol
`funcional` son los *"Control Owners"* con alcance *"solo los controles asignados"*, y
el documento mapea esa tabla a **CC6.1** junto con `users`. Entonces:

| Qué                                                                           | Dónde vive                                          | Para qué                                               |
| ------------------------------------------------------------------------------ | ---------------------------------------------------- | ------------------------------------------------------- |
| **Cargo** (COO, TI, Cumplimiento, Proceso, CISO, propietario del activo) | Catálogo base, en `evidence_requirements.responsible_id` | Que el catálogo sirva para cualquier cliente           |
| **Persona** (usuario `funcional`)                                      | Escenario del cliente, en`user_control_assignments`      | Notificar, filtrar "mis controles", seguir el pendiente |

La rotación de personal no toca el catálogo. Y el permiso de asignar es de
`admin_monkey` y `admin_empresa`.

**A2 · Un activo puede pertenecer a varios servicios (`N:M`).**
Lo decide el blueprint del Centro de Control, aunque no hable del caso: su unidad de
seguimiento es **el activo**, con *una* ficha, *una* cobertura técnica y *una* serie de
ejecuciones. Registrar el mismo servidor dos veces —una por servicio— duplicaría
ejecuciones de sonda sobre la misma máquina, duplicaría su inventario y rompería la
pantalla que el comité diseñó. Si ese activo falla, arrastra a todos los servicios que
lo usan, que es lo que pasa en la realidad.

Implica una tabla puente `service_assets` y que el activo cuelgue de la
**organización**, no del scope de un solo servicio (§6.3).

**A3 · La exclusión la propone el consultor y la aprueba el cliente; vence con el
periodo de evaluación.**
Tres fuentes convergen: el catálogo de TEST ya trae el *tratamiento de excepciones*
paso a paso; el desglose SOC 2 dice que en lo automático *"es preferible no hacerlo"*;
y el RBAC hace de *aprobar evidencia* un permiso **exclusivo de `admin_empresa`**. Una
exclusión aprobada solo por Monkey sería inconsistente con esa matriz.

- **Propone:** el consultor (rol `consultor`, D64). **Aprueba:** el cliente (`admin_empresa`).
- **Vigencia:** hasta el fin del periodo de evaluación del marco contratado. Al
  renovar, se revalida — no se hereda en silencio.
- **En lo automático se desalienta**: requiere sustentación técnica escrita, y el
  veredicto de la sonda no se sobrescribe sin ella.

**A4 · El catálogo maestro se versiona, y cada evaluación guarda contra qué versión se
midió.** No hay alternativa defendible: sin versión, un histórico no es comparable y un
número entregado a un auditor puede cambiar solo. Ya ocurrió una vez (la reclasificación
de 223 checks).

Implica una entidad `catalog_versions` y un campo de versión en `evaluations` (§7.4).
**Qué se propaga solo y qué requiere aceptación** se cerró después: ver la ampliación de A4
más abajo ("cerrado el 20 de septiembre").

### Bloque B y C — el cálculo

**B1 · No se pondera por nivel de riesgo.** Todos los controles valen igual. El peso ya
vive en las dimensiones del control, y ninguna fuente del comité pondera por riesgo. Meter
una segunda ponderación encima haría el número imposible de explicar, y `philosophy.md`
exige poder explicarlo. El nivel de riesgo sigue sirviendo para **priorizar qué atender
primero**, que es su función real.

**B2 · El requisito es binario, igual que el control.** Se cumple cuando todos sus
puntos de enfoque están cubiertos por controles cumplidos; por debajo, está fallando, y
se muestra el detalle de qué falta. Es lo coherente con "un control está cumplido solo al
100%", ya decidido. El porcentaje sigue existiendo como **diagnóstico**, no como estado.

> Si el comité dijera que su 40/60 era cumplimiento parcial del requisito, esta decisión se
> revisa. Mientras tanto, binario.

**B6 · La regla del schedule la editan `admin_monkey` y `admin_empresa`**, dentro de
límites que Monkey define (una frecuencia mínima por tipo de conexión). Es coherente con
que *configurar conectores* ya sea permiso de ambos roles: negarle el schedule al cliente
sería inconsistente con lo que ya puede hacer.

**C1 · La evidencia es válida si cae dentro del periodo de evaluación** del marco
contratado. No es un plazo absoluto por tipo de documento: es relativo al periodo
auditado, que es como razona el material fuente (*"usuarios creados en el periodo objeto
de evaluación"*, *"período bajo auditoría"* en los 61 TEST). Una política aprobada hace
tres años sigue sirviendo si estuvo vigente durante el periodo.

### Bloque D — lo que abrió el material fuente

**D2 · Peso lineal, y punto (en el MVP).** Todas las dimensiones aplicables pesan igual.
No se construye configuración de pesos. Es transparente, explicable en una frase, y es
lo que muestra la matriz del comité. Queda como deuda revisable si un cliente real
demuestra que le distorsiona el número.

**D3 · `client_controls` es una entidad propia** que apunta al control base. La
"Interpretación Cliente" del desglose SOC 2 es un párrafo con las herramientas y cargos
reales del cliente, no un ajuste de redacción: mezclarla con el texto del catálogo haría
peligrosa cualquier propagación. Es una tabla más y protege el criterio experto.
**El requisito y sus puntos de enfoque no se clonan**: el escenario los referencia desde
el plano central, porque son texto de un estándar y no se particularizan.

**D4 · Hay un cuarto tipo: `technical_manual`.** Dos fuentes distintas lo nombran por la
misma causa — *"manual dependiente de TI"* y *"pruebas técnicas-manuales (SQL/consola)"*,
documentado justo donde la sonda no llega. Es aditivo al enum y cambia dos cosas reales:
a quién se asigna (perfil técnico) y si es "automatizable en el futuro" o "manual por
naturaleza".

**D5 · Se mantienen las 5 dimensiones. Endpoints y comunicaciones se monitorean pero no
son dimensiones.** Generan hallazgos y aparecen en el Centro de Control, pero no abren
una columna nueva en el modelo de medición. Romper las "5 dimensiones" —que están en el
enum, en el cálculo, en la UI y en toda la documentación del comité— para un dominio con
un solo control no se justifica.

Lo que sí cambia: `AssetType` gana **Aplicación** y **Documentación** (que sí son
dimensiones y faltaban), y `ChecklistOs` se reemplaza por un **catálogo de plataforma +
política** (77 políticas reales, 18 plataformas).

**D6 · El mapeo de checks es por política.** La clave es plataforma + política +
`check_id`. Si un activo corre una política sin mapeo, ese control queda **sin medir**
para ese activo — que es exactamente el tercer estado ya decidido, y es honesto. No se
inventan equivalencias entre versiones de benchmark.

**D7 · Vulnerabilidades: solo insumo en el MVP.** Alimentan los hallazgos de los
controles de gestión de vulnerabilidades y parches (que el propio comité mapea a `CC7.1`
/ `A.8.8`). El módulo con vida propia —listado, tendencia, ciclo Active/Solved/Mitigated,
219 h estimadas— queda **LATER**, no en el MVP.

**D8 · El muestreo se modela como dato, no como texto.** Población, periodo, tamaño,
muestra sugerida y método de selección son campos del TEST, porque **ya vienen así en el
catálogo**: modelarlos es transcribir, no diseñar. El cálculo automático de la muestra
("son estos 7 casos, súbeme su autorización") es la promesa del producto, pero se
construye después: primero se guardan los campos.

**D9 · Monkey cura el catálogo central; la matriz RBAC aplica al escenario del cliente.**
Ésta era una contradicción aparente: la matriz dice que `admin_monkey` **no** puede crear
controles, y el modelo de dos planos dice que el catálogo maestro es el activo de Monkey.
Se resuelve leyendo la matriz en su contexto — describe permisos **sobre los datos de una
empresa cliente**, donde efectivamente Monkey no debe inventarle controles. En el catálogo maestro, Monkey
administra sus propios controles, que es lo que el admin interno (`Frontend`) ya hacía con la
feature `grc-framework` antes de que se retirara con el modelo viejo (`acbd907`).

**D10 · `regulations` es una entidad propia y no se puntúa.** Nadie contrata la Ley 1581:
le aplica. Sirve como contexto para el análisis de riesgo inherente y para el reporte,
pero **no genera porcentaje de cumplimiento** — mostrar un "% de la Ley 1581" sería
certificar algo que nadie certifica, y `philosophy.md` lo prohíbe.

**D11 · `csocs` y `cuecs` son entidades propias, marcadas como no medibles por Monkey.**
Son secciones 7 y 8 obligatorias de la Descripción del Sistema, y el propio catálogo ya
reconoce el patrón: `CPL-1` es el único de los 119 controles del catálogo sin asignar (por eso los asignados son 118), precisamente
porque *"es la Descripción del Sistema, Sección III del informe"*. Modelarlas permite
generar esas secciones desde el sistema en vez de redactarlas a mano en cada auditoría.

**D12 · Se guarda el mapeo completo, en una tabla `check_mappings` (`check_id`, `framework_code`, `framework_version`, `requirement_code`).** Las 20 referencias con sus versiones (`PCI DSS v4.0` y `v3.2.1` conviven), y
**MITRE también** — táctica, técnica y mitigación son lo que permite explicar *por qué*
importa un hallazgo, que es la traducción que promete el producto. Descartarlo obligaría
a re-mapear 11.352 checks al activar el segundo marco: sería tirar el activo más valioso
que ya está construido.

**D13 · La nube se reporta como cobertura pendiente.** Un servicio 100% cloud verá su
cumplimiento casi enteramente documental y **la cobertura técnica en 0%, visible**, no
escondida. El modelo no cambia: es el tercer estado ya decidido. Construir los checks de
nube para los 11 TEST `T-CLD-*` es trabajo de roadmap, no una decisión de modelo — pasa a
`mvp-roadmap.md`.

### Cerrado por el ejemplo de fórmula (entregado el 16 de septiembre, por la tarde)

> El porcentaje se agrega según D62; lo de abajo es lo que sigue vigente de esta sección.

**D1 · El 40/60 de la matriz ya no bloquea nada: el comité especificó la fórmula completa.**
La pregunta era si ese número era proporción de automatizabilidad o cumplimiento parcial
del requisito. El ejemplo de fórmula del comité (`modelo-datos.md` §9) la vuelve irrelevante para el
cálculo: **la fórmula no pasa por el requisito**. Va test → dimensión → control → categoría → marco (D62, `modelo-datos.md` §9).

- Si el comité quiere conservar la automatizabilidad de un requisito como dato, es un
  **indicador aparte** y no toca el cálculo.
- **B2 (requisito binario) queda confirmado y a la vez deja de ser crítico**: el requisito
  no participa del porcentaje. Sirve para trazabilidad y para el reporte al auditor
  (*"¿qué evidencia tengo para CC6.1?"*), no para medir.

**Cómo se agrega el porcentaje ya no es de esta decisión:** lo fija D62 (se cuenta cumplido contra total en cada nivel; `pending` y `not_applicable` no son fallos).

**Mitigación y riesgo residual son indicadores separados del cumplimiento** (R-11, R-12),
y no se derivan del porcentaje. Entran al modelo como tales (§7.2).

**El responsable existe por nivel de objeto** — activo, control, cumplimiento, riesgo — y
**el plan de acción es del control**. Sale de la hoja de trazabilidad (`modelo-datos.md` §9, "La trazabilidad de una falla") y amplía la
decisión A1, que solo cubría el responsable de una evidencia.

---

### Cerrado el 20 de septiembre

**A4 (propagación) · El comité aceptó la recomendación, con dos matices que la completan.**

| Tipo de cambio en el catálogo | Se propaga solo | Requiere aceptación del consultor |
|---|---|---|
| Corrección de redacción de un control | ✅ | |
| Control nuevo agregado al catálogo | ✅ | |
| Cambio en cómo se mide un control (peso, dimensiones, tests) | | ✅ |
| Control que se elimina del catálogo | | ✅ |
| Cambio en la procedencia o confianza del mapeo de un check | | ✅ |

La quinta fila no estaba nombrada en la recomendación original y se cerró junto con el
resto: un cambio de confianza en el mapeo puede invalidar evidencia que el consultor ya
aceptó para ese cliente, así que se agrupa con lo que altera la medición, no con la
corrección de redacción.

**Y el efecto de un control nuevo se resolvió: aplica desde el siguiente periodo de
evaluación.** El % que el cliente ve durante el periodo en curso no se toca — un control
nuevo en el catálogo maestro no baja el número a mitad de camino. Entra a contar recién en
la evaluación del periodo siguiente. Esto protege un número que ya pudo haberse entregado a
un auditor, y es coherente con que la evidencia sea válida por periodo (decisión C1).

Implica que `catalog_versions` (§3.5) lleve, además de qué cambió, **si ese cambio se propaga
automáticamente o queda pendiente de aceptación por el consultor**, y que `service_frameworks`
sepa desde qué periodo aplica cada versión.

**D14 (multi-tenancy) · Es híbrido: el cliente elige, no Monkey.**

El comité no escogió entre las dos opciones que planteaba el ticket — dijo que **conviven**,
y lo que lo motiva es la política del cliente, no una regla técnica interna:

> ⚠️ **Superada en parte por D24 y D25.** Lo que sigue vigente es que las dos estrategias
> conviven y que la del cliente es la razón de fondo. Lo que cambió: el atributo vive en
> `companies`, no en `organizations`, y **quien lo marca es `admin_monkey` al registrar la
> empresa en Monkey Admin**, no el cliente durante el onboarding.


> *"Hay clientes que por políticas de su empresa siempre quieren que sus datos estén
> separados y aislados en total (una base de datos solo para ellos), y los que no lo pidan
> se harán mediante RLS en una base de datos centralizada."*

Es decir:

- **Aislamiento físico (base de datos por cliente)** — para el cliente que lo exige por
  política propia. Es lo que Monkey ya tiene construido (`prisma/tenant/` por cliente), y
  sigue existiendo para ese caso.
- **RLS con `tenant_id` sobre una base centralizada** — para el resto, que es el caso
  por defecto y el que hace viable escalar a 1000+ empresas sin 1000 juegos de
  migraciones y backups.

**Qué cambia en el modelo:** `organizations` necesita un atributo de **estrategia de
aislamiento** (`dedicated` / `shared`), decidido en el onboarding y no reversible sin
migrar los datos del cliente. El plano `prisma/tenant/` deja de asumir una base por
cliente: el acceso a datos tiene que resolver, por cliente, si va contra su propia base o
contra la base compartida filtrando por `tenant_id`. El plano `prisma/central/` (catálogo
maestro, registro de clientes) no cambia.

Y la política RLS tiene que perseguir el mismo objetivo que el comité pidió para el caso
aislado: que **la base de datos lo prevenga**, no el código de aplicación — ninguna query
sin el filtro de tenant debe poder ejecutarse, y eso se hace con políticas RLS a nivel de
Postgres, no con un `WHERE tenant_id = ?` que cada desarrollador tiene que recordar poner.

---

## D23 (Cumplimiento) · No es un 4º componente del onboarding

> ✅ **Confirmada por el comité el 2026-09-26.** Estuvo abierta como P1 en
> `modelo-datos-pendientes.md` desde el 2026-09-20 a la espera de ese visto bueno. El comité
> confirmó que el módulo de Cumplimiento queda fuera del onboarding, así que la decisión que
> sigue es firme y `modelo-datos.md` la afirma sin reserva.

**Pregunta:** el onboarding tiene 3 componentes (Contexto Organizacional, Contexto del
Servicio, Control Técnico). ¿Se agrega un 4º componente "Cumplimiento" donde el cliente
configura riesgos, causas y controles, y se exige antes de poder usar el resto del
producto?

**Decisión: no.** Cumplimiento es un módulo aparte, sin límite de tiempo y sin bloquear
nada. Razones:

- **El catálogo ya se clona solo.** Al elegir marco en el Componente 2, el set de
  riesgos/causas/controles de ese marco se clona automáticamente al escenario del
  cliente (`modelo-datos.md` §3.5). El cliente no necesita crear nada a mano para que el
  cumplimiento empiece a medirse.
- **Lo que sí requiere un módulo propio es la personalización** — reescribir la
  interpretación de un control, ajustar dimensiones, asignar responsables, excluir un
  check — y eso ya es trabajo de `admin_empresa` en cualquier momento, no un requisito de
  arranque (`modelo-datos.md` §5.1, los 5 roles; la matriz de permisos, en §5.5).
- **Los 3 componentes que especificó el comité en el TSC INTEGRAL no incluyen
  Cumplimiento.** El documento más detallado y más reciente ya refleja esta separación.
- Gatear funciones básicas (crear usuarios, conectar activos) detrás de una
  configuración de cumplimiento manual contradice `philosophy.md` (onboarding de
  friction mínima).

**Fuente:** decisión de producto, 2026-09-20, a partir de la tensión encontrada entre
`modelo-datos.md` §3.5 ("Riesgo y Causa: sí, se instancian… según su entendimiento") y el
alcance de 3 componentes ya documentado en `modulos/onboarding.md`. Se corrigió §3.5 para
distinguir clonado automático (onboarding) de personalización (módulo Cumplimiento,
aparte). **Confirmada por el comité el 2026-09-26** (vía Héctor), que era lo único que
quedaba abierto: el onboarding se queda en 3 componentes.

---
## D24 (aprovisionamiento) · Monkey Admin y Monkey Platform son dos aplicaciones distintas; el registro del tenant define nombre y aislamiento

**Pregunta:** ¿el registro de una empresa (tenant) y el primer acceso del cliente pasan
por la misma app que usa el cliente, o por algo distinto?

**Decisión:**
- **Monkey Admin es una aplicación web completa y separada**, con dominio propio,
  exclusiva del equipo Monkey — no una vista sin UI, sino otro producto.
- El formulario de registro del tenant tiene **3 campos**: nombre o razón social,
  check de "¿requiere base de datos dedicada?", y correo administrativo de la empresa.
- Al enviarlo se crea `companies` (con ese nombre y con `isolation_strategy` derivado del
  check) y se genera una **clave de acceso** de un solo uso, con expiración, que se envía
  **al correo administrativo capturado en el formulario**.
- El cliente usa esa clave para crear su cuenta `admin_empresa` en **Monkey Platform** y
  recién ahí arranca el onboarding — con el nombre de la empresa ya precargado y
  bloqueado en el Componente 1, porque se fijó en el registro del tenant.

**Qué cambia en el modelo:** se corrige `modelo-datos.md` §4.3 — `isolation_strategy` es
atributo de `companies`, no de `organizations` (la empresa como tenant existe antes de que
el cliente declare nada de negocio). Se agrega la tabla `access_keys` (§4.1). El campo
`name` de `organizations` en el onboarding no es editable: es de solo lectura, reflejo
del `name` ya capturado en `companies`.

**Por qué importa ahora:** condiciona el día 1-2 del sprint de Onboarding (fundación de
Auth) — sin esto no hay forma de que el primer `admin_empresa` entre al sistema.

**Fuente:** confirmación de Héctor, 2026-09-21 y 2026-09-22.

---
## D25 (aprovisionamiento/simplificación MVP) · Una sola base de datos por defecto, no dos planos separados

**Pregunta:** el modelo hablaba de un "plano central" (catálogo) y un "plano del
tenant" (datos del cliente) como bases físicamente separadas — ¿se mantiene así para el
MVP?

**Decisión: no.** Para el MVP, el caso `shared` (por defecto) es **una sola base de
datos** con todas las tablas — catálogo maestro y datos de todos los tenants —, aislada
por RLS sobre `tenant_id`. Catálogo y escenario del cliente se relacionan con **FK
reales** (p. ej. `service_frameworks` → `frameworks` con una foreign key, no una copia ni una
llamada entre bases). Son más tablas en una sola base, pero es más fácil de entender,
de consultar y de mantener para el tamaño del MVP — dos bases separadas es una
complejidad que no se justifica todavía.

**Lo que no cambia:** la opción `dedicated` sigue existiendo (D14) y sigue siendo
excepcional, elegida por `admin_monkey` al crear la empresa en Monkey Admin (D24), no
por el cliente durante el onboarding. Cuando se elige, esa empresa obtiene una réplica
completa del esquema (catálogo + datos propios) en su propia base, sin cruzar con nadie.

**Qué cambia en el modelo:** se corrige `modelo-datos.md` §4.3 y §3.5 — ya no se habla de
"plano central" vs "plano del tenant" como bases distintas; es una distinción lógica
dentro del mismo esquema para el caso compartido.

**Fuente:** decisión de Héctor, 2026-09-21, como simplificación deliberada para el MVP.

---

## Revisión de migraciones contra el modelo (2026-09-29) · D26 a D32

Al auditar las 17 migraciones del Backend contra este modelo salieron huecos que no dependían
del comité. **Son decisiones de desarrollo** (Héctor, 2026-09-29): corrigen el schema para que
respete lo que el modelo ya decía, o cierran un punto donde el modelo se contradecía a sí mismo.
Si el comité no está de acuerdo con alguna, se revisa con él; ninguna toca cómo se calcula el
cumplimiento.

## D26 · Tipos enum en `snake_case`

**Decisión:** los 41 tipos enum de Postgres se renombran de `"UserRole"` a `user_role`
(`@@map` en Prisma + `ALTER TYPE … RENAME`). Sin comillas dobles en SQL a mano. El cliente
generado no cambia. Cierra lo que estaba abierto en la bitácora de la reconstrucción (§9).

**Por qué:** la convención de identificadores del modelo es `snake_case` sin excepción, y las tablas
estaban vacías: es el momento más barato, antes de que haya seeds y funciones escritas a mano.

## D27 · Qué dice una evaluación, y por qué es inmutable de verdad

**Decisión:** `evaluations` gana `test_id` (obligatorio) y `check_id` (opcional, cuando la midió
la sonda), y `evaluated_at` pasa de fecha a **instante**. La inmutabilidad se impone en la base:
el rol de la app no puede `DELETE`, y solo puede `UPDATE` `confirmed_by` y
`closure_observation_reason` (el cierre humano de §7.5).

**Por qué:** sin `test_id`/`check_id` una evaluación no dice qué se evaluó, y §9 exige señalar
"el activo y el check exactos"; las exclusiones (§7.3) son por test + check. Con fecha, dos
corridas de la sonda el mismo día (cada 6 h) no se pueden ordenar.

## D28 · Riesgos y causas: plantilla en el catálogo, copia por cliente

**Decisión:** el catálogo (`risks`, `causes`) es solo plantilla. Al contratar un marco se copian a
`client_risks` y `client_causes` del servicio, junto con sus relaciones (`client_risk_causes`,
`client_cause_controls`). `mitigations`, `residual_risks` y `risk_treatments` apuntan a la copia
del cliente. `service_risks` desaparece (`client_risks` ya lleva el servicio).

**Por qué:** §3.5 y §7.2 dicen que el cliente crea, edita y elimina sus riesgos y causas, pero las
tablas apuntaban directo al catálogo global: editar habría cambiado el riesgo de todos los
clientes. Lo que un cliente cambia solo lo ve él.

## D29 · Búsquedas previas al tenant: funciones `SECURITY DEFINER`, email único global

**Decisión:** el login, el canje de la clave de acceso, el refresh y la autenticación por API key
buscan antes de conocer el tenant. Cada una tiene su función angosta (`find_login_candidates`,
`find_access_key`, `find_session_by_token`, `find_api_key`). El `email` de `users` es **único
global** y en minúsculas.

**Por qué:** RLS falla cerrado y esas cuatro búsquedas no tienen contexto. El login recibe solo el
email (contrato de auth) y un auditor es un único usuario que audita varias empresas, así que un
email único por empresa dejaba el login ambiguo.

## D30 · Cargos, clonado de evidencia y de tests (cierra P4)

**Decisión:** el cargo vive en `organization_responsibles` (escenario del cliente), no en un
catálogo global: `evidence_requirements.responsible_id` apunta ahí y el requisito se clona con el
responsable vacío. `evidence_requirements` gana `source_ref`. `tests` y `control_measurements`
**no se clonan** en el MVP: se referencian con FK.

**Por qué:** P4 preguntaba si se añadía un catálogo de cargos; el Backend ya había implementado la
segunda opción y funciona. Los tests y los pesos no los reescribe el cliente en el MVP (R-09), y
clonarlos solo duplicaba 61 tests por tenant. **Pendiente de ratificar con el comité**, aunque no
bloquea nada.

## D31 · RLS también en `catalog` (escritura), `companies`, `access_keys` y `audit_logs`

**Decisión:** en `catalog` todos leen pero solo `admin_monkey` escribe (`app.user_role`). `companies`
y `access_keys` las ve su tenant o `admin_monkey`. `audit_logs` la lee su tenant o `admin_monkey`
(así las acciones de plataforma sin tenant no quedan ilegibles) y se escribe sin `RETURNING`.

**Por qué:** el rol de la app tenía `INSERT/UPDATE/DELETE` sobre todo el catálogo y `SELECT` sobre
todas las empresas: un fallo en un endpoint de cliente alcanzaba a todos los demás.

## D32 · Las `N:M` de dominios de monitoreo, explícitas

**Decisión:** `monitoring_domains ↔ requirements` y `monitoring_domains ↔ automated_capabilities`
son tablas puente propias (`monitoring_domain_requirements`, `monitoring_domain_capabilities`).
`automated_capabilities` pierde su `monitoring_domain_id`.

**Por qué:** el modelo dibuja las dos como `N:M`; la migración había hecho la segunda `1:N` y la
primera con una tabla implícita de Prisma (`_MonitoringDomainToRequirement`, columnas `A`/`B`, sin
`id`) que rompe la convención de tablas puente.

---
## D33 · Riesgos: categoría de 11 valores y evaluación 5×5 que hace el cliente

**Decisión:** en `catalog.risks` y `tenant.client_risks`, `trust_criterion` es un enum propio
(`risk_criterion`, 11 valores) y no el de los TSC; `likelihood`, `impact`, `inherent_risk_value` e
`inherent_risk_level` son **opcionales** (`inherent_risk_level`: `low|moderate|high|critical`).
`failure_category` pasa de 2 a 6 valores.

**Por qué:** se contrastó el modelo con el Excel maestro (que gana, según CLAUDE.md). La hoja
*Riesgos* usa categorías que no son TSC (Cumplimiento, Continuidad, Fraude, Terceros, Reputación,
Operación) y trae probabilidad, impacto y nivel **vacíos** en los 10 riesgos: son un dato del
cliente, no del catálogo. Con las columnas obligatorias el catálogo no se podía ni cargar. La hoja
*Causas* trae las 6 categorías de falla, con lo que se cierra ese TODO. Corrige un error de esta
misma revisión, que había convertido `trust_criterion` en el enum de los TSC.

**Fuente:** `assets/TSC INTERGRAL SOC 2 DETALLADO VF.xlsx`, hojas *Riesgos* y *Causas*.

---
## D34 · Los enums que estaban como texto, cerrados

**Decisión:** los 16 campos que el schema tenía como `String` con un `TODO` pasan a enum, con los
valores de `contracts/enums.md` («Catálogo, cumplimiento y control técnico»): `frameworks.type`,
`policies.approval_status`, `checks.mapping_confidence`, `service_frameworks.status`,
`assets.type/criticality/origin/status`, `asset_provisionings.connection_status`,
`action_plans.status`, `residual_risks.residual_level`, `evidence_submissions.validation_status`,
`evaluations.origin`, `findings.severity`, `vulnerabilities.severity` y `executions.status`.
Los estados nacen con su valor inicial por defecto (`pending`, `active`).

**Excepción:** `tests.type` se queda como texto libre, porque en la hoja *Pruebas* del comité mezcla
`Manual`, `Mixta`, `Técnica` y 17 descripciones largas distintas; no hay un enum honesto que
extraer sin inventar.

**Por qué:** ni el Excel ni el modelo daban las opciones. Se tomaron de donde había fuente
(`origin: declared|discovered` y `connection_status: pending→validated` del contrato de activos;
`confirmed|high|medium|low` de `monkey-cis-sync`; los niveles 5×5 del Excel; CVSS para la severidad)
y, donde no, del flujo de negocio del propio modelo (conectar → validar → activar → programar;
solo `admin_empresa` aprueba evidencia). Un enum cerrado impide que un estado mal escrito rompa un
filtro o el cálculo. Si el comité entrega otros valores, gana el comité y se cambian con una
migración sin pérdida de datos.

**Fuente:** decisión de Héctor, 2026-09-29.

---
## D35 · Siembra del catálogo de SOC 2 (MD-65): dominio del control, publicador opcional y estrategia

**Decisión:**
1. **El dominio pasa de `requirements` a `controls`** (`controls.domain`, 27 valores literales). Se
   elimina `requirements.domain`.
2. **`catalog_versions.published_by` es opcional.** La versión 1 la publica un script, sin usuario
   humano, y lo dice en `change_summary`. No se crean usuarios ni empresas falsas.
3. **Se siembran 119 controles**, incluido CPL-1 ("Descripción del Sistema"), que queda sin puntos de
   enfoque (en el producto lo cubre `system_descriptions`). Son **729 relaciones**, no 658.
4. **Estrategia:** el Excel se convierte a un JSON versionado (`prisma/seed/data/soc2-catalog.json`,
   con el sha256 del archivo de origen); el seed lee ese JSON. Valida antes de escribir, inserta en una
   sola transacción, **solo agrega lo que falta**, aborta con diff si una fila existente difiere y no
   borra nada. Un cambio al catálogo entra por una versión nueva (A4/D33), no por recarga.

**Por qué:** al perfilar el Excel, `Dominio` varía dentro del mismo requisito en 41 de 61 (es atributo del
control) y `requirements.domain`, obligatorio, no tenía fuente. La cifra de 658 relaciones del ticket
MD-65 sale de la hoja `Resumen`, que el propio modelo ya documenta como desactualizada: los datos crudos
traen 729. Y la FK obligatoria `published_by → users` habría exigido crear un usuario solo para poder
sembrar. Un JSON versionado permite reproducir la carga sin tener el Excel (que está en `.gitignore`) y
deja trazable de qué archivo salió.

**Fuente:** `assets/TSC INTERGRAL SOC 2 DETALLADO VF.xlsx`, hojas *Controles Monkey* y *Tabla controles
SOC 2*. Decisión de Héctor, 2026-09-30.

---
## D36 · Controles del cliente completos, clonado y plantillas de evidencia

**Decisión** (precisa D3, D28 y D30):
1. **El cliente crea, edita y elimina controles**, así que todo lo que se mide cuelga de
   `client_controls`: `evaluations` y `evidence_requirements` apuntan a `client_control_id`, no al control
   del catálogo. `client_controls.control_id` es opcional (plantilla de origen; nulo en un control propio).
2. **Eliminar es dar de baja**: `is_active` en `client_controls` y `client_causes` (`client_risks` ya lo
   tenía). Las evaluaciones son inmutables y las FK son `RESTRICT`.
3. **Único `(service_id, control_id)`** en `client_controls`: el clonado es idempotente (MD-80).
4. **Se clonan** las dimensiones (`client_control_dimensions`) y el **vínculo** control ↔ test
   (`client_control_tests`). **No se clonan** los tests (se referencian) ni `control_measurements` (D2).
5. **Plantillas de evidencia** en el catálogo (`evidence_templates`, `control_evidence_templates`), de donde
   se clonan las `evidence_requirements` de cada control del cliente.

**Por qué:** con `control_id` obligatorio y las evaluaciones colgadas del catálogo, un control propio no se
podía evaluar ni pedirle evidencia, aunque la matriz de permisos deja a `admin_empresa` crearlos. Los tests
son 61 procedimientos que el cliente no edita: copiarlos solo los duplica por cliente, pero el vínculo sí es
suyo (A4 exige aceptación para cambiar los tests de un control, lo que presupone esa copia). D2 fija el peso
lineal sin configuración, así que una fila de `control_measurements` sería un dato muerto. Las plantillas de
evidencia salen del Excel: 89 vínculos entre 67 de los 119 controles y 50 documentos distintos (la
hoja *Tabla controles SOC 2*, "Documentos vinculados"); antes `evidence_requirements` se decía clonable pero no
existía de dónde. La dimensión de esas plantillas es `policy`: el Excel no la trae y son documentos.

Un control propio no tiene punto de enfoque, así que no cierra ningún requisito del marco; cuenta para el porcentaje de su categoría (D65).

**Fuente:** decisión de Héctor, 2026-09-30.

---
## D37 · El MVP contempla solo SOC 2

**Decisión:** el MVP trabaja únicamente con **SOC 2**. ISO 27001, SOC 1, PCI DSS, HIPAA, NIST CSF y el resto
quedan para fases posteriores (`mvp-roadmap.md`: ISO 27001 pasa a la Fase 1).

**Qué implica:**
- `frameworks` tiene una sola fila (`soc2`, versión 2017) y el selector de marco del Componente 2 sale de esa
  tabla, no de una lista fija: un marco no sembrado no se puede elegir (la FK de `service_frameworks` lo
  rompería).
- El modelo sigue siendo multi-framework por diseño (el control es atómico): no se construye nada que
  impida sumar marcos después, pero tampoco se siembra ni se ofrece ninguno.
- No cambia `services.previous_certification` (es lo que el cliente ya tuvo, no lo que contrata) ni el
  catálogo `regulations` (leyes aplicables, no se puntúan: D10).
- `frameworks.type` conserva sus 4 valores; en el MVP solo se usa `attestation`.

**Por qué:** un selector con seis marcos y un catálogo con uno es una trampa: elegir cualquiera de los otros
cinco fallaba o dejaba al cliente sin nada que clonar. **Fuente:** decisión de Héctor, 2026-09-30.

---

## D38 · El dato real manda: cómo se siembra y qué se encontró

**Regla:** las cifras de cualquier documento, ticket o resumen se comprueban contra los datos crudos de las
hojas; si difieren, **vale lo medido** y el documento se corrige. El seed fija esas cifras medidas (si el
Excel cambia, la extracción falla hasta que se actualicen de forma consciente) y deja constancia en
`catalog_versions.change_summary` de lo que el archivo dice y los datos no confirman. **No se adivina ni se
infiere nada**: lo que no tiene fuente no se siembra y pasa a pendiente.

**Lo medido contra lo que decían los documentos:**

| Dato | Decía | Hay |
|---|---|---|
| Relaciones punto de enfoque ↔ control | 658 (hoja *Resumen*) | **729** |
| Controles del catálogo | 118 | **119** (118 asignados + CPL-1, Descripción del Sistema) |
| Asignaciones control ↔ prueba | 228 | **284** en la hoja *Pruebas*; la matriz trae 248, de las que 27 citan pruebas inexistentes |
| Documentos vinculados a controles | 88 | **89** vínculos, **50** documentos distintos, en 67 controles |
| Políticas vinculadas | 16 | 16 vínculos a **10** políticas distintas (se siembran como plantillas en D39) |
| Controles a los que sirve `T-DOC-001` | "más de 30" | **103** |
| Pruebas con checks automáticos · checks · políticas SCA · plataformas · referencias de mapeo | 13 · 11.352 · 77 · 18 · 20 | confirmados: **13 · 11.352 · 77 · 18 · 20** |

**Correcciones al schema que salen de los datos** (migración `catalog_seed_and_client_controls`):
`tests.population_size` y `tests.suggested_sample_size` pasan de entero a **texto** (en el Excel son frases);
se agrega `tests.exceptions` (la hoja trae *Excepciones/Desviaciones* y *Tratamiento de excepciones*, el schema
solo guardaba una); el dominio pasa al control (D35).

**Decisiones de siembra:**
- **Asignaciones control ↔ prueba:** se usa la hoja *Pruebas* (284: cubre 61/61 pruebas y 118/118 controles y
  contiene las 221 resolubles de la matriz). Las 6 pruebas `T-APP-001…006` de la matriz **no se equiparan** con
  `T-SRV-011…014` y `T-BD-009/010`, aunque coinciden en 94-100% de sus controles: es una pregunta del comité (P9).
- **Causas:** se cargan las 56; 10 no pertenecen a ningún riesgo en la hoja y se cargan sin asociar (P9).
- **Plantillas de evidencia:** el código es `DOC-` + hash del texto normalizado, no un consecutivo, para que
  agregar un documento no renumere los demás (las evidencias del cliente guardan ese código en `source_ref`).
- **`control_measurements` no se siembra** (sin uso en el MVP, D2). `control_dimensions` y `policies` no se
  sembraron aquí por falta de fuente (P10); se resuelven en D39.
- **Pruebas en texto:** el paso a paso y los atributos se guardan como listas separadas por su numeración
  (`1.`/`1)`) o sus viñetas; si una prueba no trae numeración 1, 2, 3… la extracción falla en vez de adivinar.

**Fuente:** perfilado de `TSC INTERGRAL SOC 2 DETALLADO VF.xlsx` del 2026-09-30. Decisión de Héctor.

---

---

## D39 · Dimensiones por control y políticas del catálogo (cierra P10)

**Decisión:**
1. **Una dimensión aplica a un control si el control tiene al menos una prueba de esa dimensión.** Se deriva de
   *Pruebas*; no hay una lista aparte. Salen **210 filas** de `control_dimensions`: 118 documentales, 43 de
   servidores, 18 de BD, 31 de nube y **0 de aplicación** (no hay pruebas T-APP: P9). CPL-1 no tiene.
2. **El tipo** sale del tipo de sus pruebas en esa dimensión: documentales → `manual` (§2: revisión documental);
   `Manual` → `manual`; `Mixta` o "automatizado + manual" → `hybrid`; `Técnica` → `technical_manual` (D4);
   "automatizado" a secas → `automated`. Si las pruebas de una misma dimensión no coinciden → `hybrid`. Un
   texto que no reconoce **falla la extracción** en vez de adivinar.
3. **Las banderas**: `requires_probe` = la dimensión no es documental y el tipo es `automated` o `hybrid`;
   `requires_ai` = solo la documental; `requires_compliance_confirmation` = todo menos `automated` (R-03: en lo
   manual evalúa el consultor; la IA no certifica).
4. **`policies` es una plantilla del catálogo: solo `name`** (único). `approval_status`, `valid_until` y `version`
   se eliminan: aprobar una política, hasta cuándo vale y qué versión es son estado **del cliente** y viven en la
   evidencia que él entrega. Se siembran las 10 políticas y los 16 vínculos; `control_policies` gana
   `requires_employee_acceptance` porque el Excel distingue "aprobación de la política" de "… y la aceptación
   del empleado".
5. Se siembran dentro de la versión 1 del catálogo, sin versión nueva: ningún cliente había clonado nada.

**Por qué:** sin dimensiones no se puede clonar `client_control_dimensions` (MD-80) ni aplicar el gate de §2, y el
modelo exige que cada control declare dónde se evalúa. Derivarlas de las pruebas deja una sola fuente de verdad: si
el comité cambia las pruebas de un control, sus dimensiones cambian con ellas. Una política global no puede estar
"aprobada": la aprobó (o no) cada empresa.

**Qué queda por ratificar:** el punto 1 es la propuesta que ya figuraba en P10. **Los puntos 2 y 3 (tipo y
banderas) los derivó desarrollo** y no vienen del Excel: se aplican para no bloquear el clonado y se ratifican con
el comité (igual que D30). Si el comité define otra cosa, se corrige con una versión nueva del catálogo.

**Fuente:** decisión de Héctor, 2026-10-01. Implementación: migración `catalog_policies_as_templates`;
`Backend/prisma/seed/` (`deriveControlDimensions`, `testKind`, `parsePolicyLine`).

---

## D40 · Reglas del clonado del catálogo al elegir marco (MD-80)

**Decisión** — lo que `modelo-datos.md` §3.5 y §6.2 no fijaban y el clonado necesitó:
1. **Qué controles son aplicables:** los que llegan por los puntos de enfoque de los requisitos del marco cuyo
   criterio de confianza contrató el servicio. Un control en dos requisitos se clona una vez. CPL-1 (sin punto de
   enfoque) no se clona: lo cubre `system_descriptions`. Un servicio **sin criterios contratados falla** con un
   error claro, no clona vacío.
2. **`own_code` = el código del catálogo** (`CAP-1`); los controles propios del cliente llevan su propia
   numeración (`C01`). **`client_interpretation` arranca con la descripción del catálogo** y `source_ref` =
   `vanta:<código>`.
3. **`client_controls.type` = el tipo común de sus dimensiones**, o `hybrid` si no coinciden (la misma regla de D39).
4. **Evidencias:** una `evidence_requirement` por plantilla, en el orden del comité, con `validity_within_period` =
   el periodo de evaluación del marco (C1), `dimension` = `policy` y responsable vacío (D30).
5. **Riesgos y causas: el set base completo (10 y 56), no solo lo aplicable** (D28); las aristas riesgo↔causa se
   copian todas y las causa→control **solo hacia controles que se clonaron**.
6. **Es idempotente y respeta la personalización:** lo que el servicio ya tiene (clonado antes, editado, dado de
   baja o propio) no se vuelve a crear, y **los hijos solo se crean para padres nuevos** — si el cliente quitó una
   evidencia de un control clonado, no reaparece. Al contratar otro criterio después se suma solo lo nuevo y se
   enlaza con lo que ya había.
7. **Corre dentro de la misma transacción que crea `service_frameworks`**, con el contexto de tenant ya fijado:
   contratar y clonar son todo o nada. El catálogo se clona contra la versión que ya guarda
   `service_frameworks.catalog_version_id`.

**Por qué:** sin estas reglas el clonado quedaba a criterio de quien lo escribiera, y 6 y 7 son las que protegen al
cliente: lo que personalizó no se pisa y un fallo no deja un servicio a medias. Medido contra SOC 2 sembrado: Seguridad
sola da 79 controles, 139 dimensiones, 194 vínculos con pruebas, 56 evidencias, 10 riesgos, 56 causas y 158 aristas
causa→control; sumar Disponibilidad agrega 6 controles.

**Fuente:** decisión de Héctor, 2026-10-01. Implementación: `Backend/src/features/onboarding/` y
`npm run clone:verify`.

---

## D41 · El audit trail es inmutable en la base de datos y se retiene 7 años (MD-92)

> La exigencia de escribir el rastro **en la misma transacción** que la acción se cumplió recién con **D52**.

**Decisión:**
1. **Inmutable para todos los roles, no solo para la app.** `audit.audit_logs` y `audit.compliance_events`
   rechazan `UPDATE`, `DELETE` y `TRUNCATE` con triggers (migración `audit_append_only_triggers`), además del
   `REVOKE` que ya tenía `monkey_app`. Antes, el dueño de las tablas podía editar y borrar el histórico.
2. **Una corrección es una fila nueva**, nunca una edición.
3. **Retención de 7 años = no borrar nada durante 7 años + respaldos que lo sostengan.** No hay purga: a los 7 años, si
   se decide eliminar algo, es un procedimiento aparte, aprobado por el comité y con su propia migración. No se diseña
   hoy.
4. **Qué se registra** (acciones del onboarding, campos, secretos prohibidos): `contracts/conventions.md` → *Auditoría*.

**Lo que garantiza y lo que no:** un rol con permisos puede desactivar un trigger (`ALTER TABLE … DISABLE TRIGGER`) o
ser superusuario. El control que lo cubre es **organizativo**: solo el dueño de la base tiene esa capacidad, sus
credenciales no están en el runtime de la app y un cambio de este tipo deja rastro en las migraciones. No se
agrega un event trigger: sería complejidad sin un riesgo que lo justifique en el MVP.

**Respaldos (lo que sostiene los 7 años):**
- **Staging:** volcado nocturno (`pg_dump`) a MinIO. Se construye con MD-91.
- **Producción:** depende de **P7** (dónde se aloja el Postgres). Un servicio administrado con respaldos y
  recuperación a un punto en el tiempo lo resuelve; auto-alojado hay que operarlo. La política de 7 años del audit
  se fija al cerrar P7. Hasta entonces el compromiso solo se puede sostener desde que haya clientes reales.

**Por qué ahora y no después:** si el audit trail arranca sin ser inmutable, el histórico de los primeros clientes no
sirve como evidencia y no se puede reconstruir. **Alcance:** `tenant.evaluations` también es inmutable y solo está
protegida por `REVOKE`; queda como siguiente candidato a la misma garantía.

**Fuente:** `modelo-datos.md` §5.3 y §7.4 (SOC 2 Type II). Decisión de Héctor, 2026-10-01. Implementación:
`Backend/prisma/migrations/20261001190000_audit_append_only_triggers` y `npm run audit:verify`.

---

## D42 · Cómo viaja una migración a staging (MD-91)

**Decisión:**
1. **El deploy migra solo, antes de levantar el backend**, con `prisma migrate deploy` en un contenedor desechable
   construido de la etapa `build` del Dockerfile. La imagen de runtime **no** lleva el CLI de Prisma ni credenciales de
   dueño.
2. **El rol dueño llega solo a ese paso** (secret `MIGRATE_DATABASE_URL`); el `.env` del backend sigue con `APP_DATABASE_URL`
   (rol `monkey_app`, sujeto a RLS).
3. **Respaldo con `pg_dump` antes de cada migración** si la base ya tiene datos, verificado (no vacío y legible), con las
   últimas 14 copias en `~/backups/monkey/`.
4. **Si falla, el deploy se aborta** y el backend anterior sigue corriendo.
5. **No hay "deshacer": se corrige hacia adelante**; si hubo pérdida de datos, se restaura el respaldo. Una migración
   aplicada nunca se edita.
6. **Una migración nueva lleva fecha posterior a la última de `develop`**, y **la base compartida de dev solo se migra desde
   `develop`**, no desde ramas.

**Por qué:** el workflow no migraba y la base de staging nació vacía; hacerlo a mano en cada deploy es justo lo que se
olvida. Separar el rol dueño del runtime evita que un fallo de la app tenga permisos para cambiar el esquema. La regla 6
sale de un síntoma real: la base de dev tenía 3 migraciones aplicadas que el repo no tiene.

**Falta acordar con Carlos** la regla 6 (hoy los dos aplican migraciones en la base compartida desde sus ramas).

**Fuente:** decisión de Héctor, 2026-10-01. Implementación: `Backend/scripts/deploy/migrate.sh`,
`Backend/.github/workflows/deploy-dev.yml`; procedimiento y primer arranque: `schema-implementacion.md` §7, §8 y §13.

## D43 · La clave de acceso se canjea una sola vez, y solo con el correo administrativo

> ⚠️ **Ampliada por D51 (2026-10-05):** la activación es de dos pasos (`POST /v1/auth/redeem/lookup` + `redeem`), el canje ya
> no recibe nombre ni apellido, y ambos endpoints tienen un freno de intentos.

**Decisión:** el canje (`POST /v1/auth/redeem`) crea la cuenta `admin_empresa` **únicamente si el
correo que escribe el cliente es el `admin_email` que Monkey registró para su empresa** (se compara
en minúsculas). Si no coincide: `422 ACCESS_KEY_EMAIL_MISMATCH` y la clave sigue pendiente. La clave
sirve **una vez**: al canjearla pasa a `used` y, desde ahí, ese administrador entra siempre con correo
y contraseña (`POST /v1/auth/login`).

**Por qué:** D24 ya dice que la clave se emite **para** el `admin_email` capturado en el registro; atar
el canje a ese correo es lo que hace que una clave interceptada o reenviada por error no sirva para
crear una cuenta con otro correo. Y como `users.email` es único global (D29), el administrador de la
empresa queda identificado sin ambigüedad desde el primer acceso.

**Cómo quedó implementado** (detalle en `contracts/modules/auth.md`, "Estado de implementación"):

- La clave se marca como usada con una actualización **condicional** (solo si sigue `pending` y
  vigente) en la misma transacción que crea el usuario: dos canjes simultáneos no pueden crear dos
  cuentas.
- Clave vencida → `409 ACCESS_KEY_EXPIRED`; ya usada → `409 ACCESS_KEY_ALREADY_USED`; inexistente,
  revocada, o de una empresa suspendida → `404 ACCESS_KEY_INVALID` (a quien solo tiene la clave no se
  le revela el estado de la empresa).
- Se registran en `audit_logs` el canje (`auth.redeem`, también los intentos fallidos con el correo
  tecleado) y la creación del usuario (`user.create`).

**No cierra P2(e)** (¿más de un correo administrativo por empresa?): hoy hay uno, y el resto de
usuarios de la empresa se invitará desde el módulo de Usuarios.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

## D44 · Componente 1 del onboarding: huecos del contrato resueltos por desarrollo

**Decisiones** (Carlos, 2026-09-30; **pendientes de ratificar con el comité**, ninguna toca cómo se
calcula el cumplimiento). Son los huecos que el contrato de `onboarding-organizational-context.md`
dejaba abiertos:

1. **Sin guardado parcial.** El contrato hablaba de un `PATCH` "mientras el cliente escribe", pero las
   columnas obligatorias de `organizations` son `NOT NULL` y no se podía guardar a medias. Se eligió no
   tocar el schema: el avance vive en el navegador del cliente (por usuario, sobrevive a la expiración
   de la sesión) y se envía completo con `PUT` al final. Si el comité quiere borradores en el servidor,
   se vuelven opcionales esas columnas y se mueve la validación de completitud a la aplicación.
2. **Un solo `PUT`** crea o actualiza. Se retira `ORGANIZATION_ALREADY_EXISTS`, que citaba un `POST`
   que el contrato nunca definió.
3. **«Ninguna» es excluyente; «Otra» queda solo marcada.** «Otra» no tiene campo de texto porque el
   modelo no tiene dónde guardar cuál es; se añade si el comité lo pide.
4. **`none` y `other` son filas de `catalog.regulations`** (jurisdicción `n/a`): la tabla puente
   referencia por FK, y guardar «Ninguna» deja constancia de que el cliente contestó que no le aplica
   ninguna, que no es lo mismo que no haber contestado.
5. **Etiquetas en inglés traducidas por desarrollo** (el Excel solo trae español, salvo `size`),
   pendientes de revisión. Platform todavía no tiene i18n: hoy se ve todo en español.
6. **Dos catálogos de países** (`incorporation_country` y `client_country`) en lugar del único
   `country` del contrato: son listas distintas (12 y 13) y el schema ya tiene dos enums.
7. **Pasos del onboarding en `/auth/me`:** `organizational_context`, `service_context`,
   `technical_control`; `next_step` es `null` cuando el cliente terminó los tres. Hoy solo se deriva el
   primero (existe la organización).
8. **Presentación:** asistente guiado de 5 pantallas cortas más una de revisión, en vez de 10
   pantallas de una pregunta. Es una lectura de `philosophy.md` ("una pregunta o acción clara por
   paso") que agrupa campos afines para no cansar; si el comité prefiere una pregunta por pantalla,
   es un cambio solo de frontend.

**Por qué:** el brain define los 10 campos, sus opciones y la forma de la API, pero no estas
decisiones de detalle; en vez de dejar el sprint detenido se tomó el camino que no cambia el modelo y
se deja aquí para revisión.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

## D45 · Componente 2 del onboarding: ajustes del schema y huecos resueltos por desarrollo

> ⚠️ **Parcialmente revertida por D51 (2026-10-05):** `service_regulations` (la regulación por servicio) se eliminó, y la
> Descripción del Sistema ya no es solo un enlace. Lo demás sigue vigente.

**Decisiones** (Carlos, 2026-09-30; **pendientes de ratificar con el comité**; ninguna toca cómo se
calcula el cumplimiento). Son los huecos que `onboarding-service-context.md` dejaba abiertos o que el
schema contradecía:

**Cambios de schema** (migración 24, `service_context_optional_fields_and_regulations`):

1. **`services.deployment_scenario` pasa a nullable.** El contrato dice que se captura en el
   Componente 3, pero la columna era `NOT NULL`: era imposible declarar el servicio antes de conectar la
   infraestructura.
2. **`subservice_organizations.provider`, `service_provided` y `responsibility` pasan a nullable.** El
   "detalle" del Excel es opcional y solo el `type` es obligatorio (el contrato ya lo decía).
3. ~~**Nueva tabla `service_regulations`**~~ **Revertida por D51** (la tabla se eliminó: la regulación se declara solo a nivel de empresa). Antes: servicio ↔ regulación, con RLS por `tenant_id`. Cerraba la
   pregunta abierta "regulación a nivel de servicio": el request del contrato ya traía
   `regulation_codes` y no tenía dónde persistir. No se puntúa (D10).

**Reglas del clonado** (lo que MD-80 / D36 dejaban sin precisar). **Superadas por D40** (Héctor, el
motor `CloneCatalogService`, que es el que corre): al fusionar `develop` se adoptó su versión. Lo que
cambia frente a lo escrito aquí: `source_ref` es `vanta:<código>`; las dimensiones y los vínculos con
pruebas **sí se clonan** (D39 sembró `control_dimensions`, ya no hay controles todos `manual`); con
solo `security` salen 79 controles. Se conservan de esta decisión la idempotencia, el no pisar y la
transacción única (puntos 8 y 9):

4. **Qué controles se clonan:** los ligados, por punto de enfoque, a requisitos del marco **cuyo criterio
   de confianza contrató el servicio** (contratar solo `security` no trae los de privacidad). Es lo que
   cuenta `applicable_requirements`. Con los 3 criterios `security + availability + confidentiality`
   salen 38 requisitos y 86 controles; con los 5, 61 y 118.
5. **Qué se clona del control:** `own_code` = código del catálogo (`CAP-1`); `client_interpretation`
   parte como la descripción del catálogo (el cliente la reescribe); `source_ref` = código de
   origen; `type` se deriva de sus dimensiones (una sola clase → esa; mezcla → `hybrid`; sin
   dimensiones → `manual`).
6. **Riesgos y causas:** se clonan **todos** los riesgos activos y todas las causas del catálogo (no se
   filtran por criterio: el criterio de un riesgo es de otra lista, §3.3), con sus relaciones; la
   relación causa ↔ control solo entre controles que el servicio sí clonó.
7. **Evidencia:** `validity_within_period` = el `evaluation_period` del marco (`AAAA-Tn`, trimestre de la
   contratación); `responsible_id` vacío (D30).
8. **El clonado es idempotente y nunca pisa:** repetirlo (al ampliar criterios con `PATCH`) solo añade lo
   que falta. Quitar criterios o un marco **no borra** nada: el marco pasa a `paused`.
9. **Es síncrono:** corre en la misma transacción que crea el servicio y el `201` ya trae
   `catalog.status = ready`. Tarda unos segundos contra la base remota (por eso `withScope` acepta un
   timeout mayor); el `processing` / `202` del contrato queda para cuando el volumen lo pida.

**Resto de huecos:**

10. **Descripción del Sistema: solo enlace** — **superado por D51** (ahora enlace y/o archivo). Antes: `kind = link`, `http`/`https`. El archivo
    (`multipart`, 25 MB) no se construyó: no hay dónde guardar binarios todavía. `kind = file` responde 422.
11. **Nombre único por empresa** sin importar mayúsculas ni espacios (`SERVICE_NAME_TAKEN`); la base no lo
    impone, la aplicación sí.
12. **`DELETE` con historia:** además de evaluaciones, bloquean la eliminación las **evidencias entregadas
    y los planes de acción** (todo trabajo del cliente). `409 SERVICE_HAS_EVALUATIONS`.
13. **(Superado por D47: `FRAMEWORK_NOT_CONTRACTED` ya se usa.)** **`FRAMEWORK_NOT_CONTRACTED` no se usa:** no existe una contratación de marcos a nivel de empresa en el
    modelo (los marcos se contratan por servicio, §6.1). Un código que no esté en `catalog.frameworks`
    responde 422 (`enum.invalid`); hoy solo existe `soc2` (D37).
14. **`PUT csocs` / `PUT cuecs` no se construyeron:** salen de las secciones 7 y 8 de la Descripción del
    Sistema, que aún no se procesa.
15. **Progreso (`/auth/me`):** `service_context` entra en `completed_steps` cuando existe al menos un
    servicio con un marco activo y su Descripción del Sistema; entonces `next_step` es `technical_control`.
16. **Presentación:** asistente de 6 pantallas más una de revisión (Tu servicio · Tus clientes · Datos y
    alcance · Marco · Proveedores · Cumplimiento), como el Componente 1. Una ficha de proveedor por tipo.

**Deja abierto:** `control_dimensions` está vacío en el catálogo (P10), así que hoy **todos los controles
clonados quedan `manual`** y sin dimensiones; el clonado ya las copia cuando se siembren.

**Por qué:** el brain define los 16 campos y la forma de la API, pero no estas decisiones de detalle; en
vez de dejar el sprint detenido se tomó el camino que no cambia el modelo de medición y se deja aquí para
revisión.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

## D46 · Componente 3 del onboarding: huecos cerrados por desarrollo

**Decisiones** (Carlos, 2026-10-01; **pendientes de ratificar con el comité**; ninguna toca cómo se
calcula el cumplimiento). Es el registro de cada hueco que `onboarding-technical-control.md` dejaba abierto
y cómo se cubrió. Lo que sigue siendo un parche está en **`deuda-tecnica/README.md`** (DT-1 a DT-36).

**Cambios de schema** (migración 25, `asset_provisioning_schedule_frequency`, más el seed de las 6 capacidades):

1. **`asset_provisionings.schedule_frequency`** (nullable, enum `continuous|every_6h|every_24h`): el paso
   «programar» no tenía dónde guardar la frecuencia. `ac_01` admite `every_6h` y `every_24h`; `ac_02` a
   `ac_06`, solo `continuous`.
2. **`catalog.automated_capabilities` se siembra** con `ac_01` a `ac_06` (estaba vacía). `ac_01` a `ac_03`
   salen del contrato; `ac_04` a `ac_06` se completaron por analogía (DT-3). El campo interno de proveedor
   existe solo en el seed.

**Reglas del producto:**

3. **«Híbrido» ofrece las seis conexiones**: el cliente usa las que le sirvan, sin tener que clasificarse (DT-7).
4. **El tipo del activo se deduce de la conexión** (`ac_01` servicio en nube · `ac_02`/`ac_04` servidor ·
   `ac_03`/`ac_05` base de datos · `ac_06` endpoint): el cliente elige «qué quiere conectar» y no lo clasifica
   dos veces. Criticidad por defecto `medium`. Código del activo `AST-0001`, consecutivo **por empresa**.
5. **El scope declarado es un eje distinto de las dimensiones** («lo que dices que tienes»). Se compara con lo
   conectado por tipo: servidor, base de datos, nube, aplicación y endpoint cuentan; `network_device` y
   `documentation` no. «Conectado» = la conexión ya se comprobó (`validated`, `active` o `scheduled`). Los
   contadores admiten `0` y se piden como «más o menos» (DT-6).
6. **El paso 3 está hecho con el escenario y el scope**; conectar sistemas se recomienda pero se puede dejar para
   después («Lo haré más tarde»). Así no se bloquea a quien aún no tiene sus accesos a la mano.
7. **Cambiar de escenario no puede dejar huérfana una conexión ya registrada** (`409 CAPABILITY_NOT_APPLICABLE`
   con los códigos de los activos afectados).
8. **Un activo puede dar soporte a varios servicios** (A2): se enlaza al crearlo y borrar un servicio no borra el
   activo.

**Honestidad con el cliente («Automatizado ≠ Operativo»):**

9. **La sonda es un puerto (`ConnectionProbe`) con dos adaptadores**, elegidos por `PROBE_MODE`:
   - `unavailable` (por defecto): `validate` responde `503 CONNECTION_UNAVAILABLE`; el activo sigue
     `pending` (no `failed`: no es culpa del cliente) y la pantalla lo explica con calma.
   - `simulated` (solo desarrollo y demostración): da por buena la conexión si las credenciales están completas
     y **nunca confirma que el activo opere**: al activar queda `warning` y la pantalla lo etiqueta «modo
     demostración». El backend **se niega a arrancar** con `simulated` en producción.
   Cuando exista un conector real se agrega un tercer adaptador sin tocar los casos de uso (DT-1).
10. **`GET /v1/services/{id}/technical-control`** devuelve en una lectura el escenario, las conexiones que
    aplican, el scope (declarado y conectado), `is_complete` y `probe_mode`. `POST /validate` añade `mode`
    (`demo` | `live`). Se añaden `GET /v1/assets/{id}` y el error `409 ASSET_NOT_ACTIVE` (programar sin activar).

**Seguridad de las credenciales:**

11. **Se cifran con AES-256-GCM** (`CREDENTIALS_ENCRYPTION_KEY`, 32 bytes en base64; sin ella la app no arranca).
    Formato `v1.<iv>.<etiqueta>.<cifrado>`. Solo viajan al crear el activo; **nunca se devuelven, se registran en
    logs ni entran al audit trail**. Se descifran en memoria solo durante la comprobación, y la sonda corre
    **fuera** de la transacción de base de datos.
12. **Credenciales por conexión** (validadas, error por campo `credentials.<campo>`): `ac_01` cuenta + rol de
    solo lectura; `ac_03`/`ac_05` usuario y contraseña de solo lectura; `ac_02`/`ac_04` agente (sin
    credenciales, por defecto) o SSH (usuario + llave privada); `ac_06` solo agente. Los agentes no guardan
    credenciales (§6.3). Qué pide cada una en realidad y cómo se entrega el agente: DT-4.

**Confidencialidad (criterio de aceptación):** el proveedor del motor no aparece en ninguna respuesta, mensaje,
log, texto de i18n, archivo de `src/` ni bundle de la aplicación. El tipo `Capability` del backend **no tiene**
`provider`, así que ningún mapper puede filtrarlo por descuido, y una prueba lo comprueba en cada recorrido.

**Por qué:** el brain define el flujo y los endpoints pero no estas decisiones de detalle, y la aplicación va
a clientes reales: en vez de dejar el sprint detenido —o de fingir conexiones que no existen— se tomó el camino
más honesto y seguro, y se deja aquí para revisión.

**Fuente:** confirmación de Carlos, 2026-10-01.

---

## D47 · El marco se contrata al registrar la empresa (revierte el veto de §6.1)

> **Ampliada por D50:** el catálogo muestra 7 marcos y solo los `available` (hoy SOC 2) se pueden contratar.

**Decisión** (Carlos, 2026-10-01; **pendiente de ratificar con el comité**). **Monkey Admin contrata el marco
para la empresa al registrarla** —hoy solo SOC 2 (D37), fijo y bloqueado en el formulario— y, al declarar un
servicio, el cliente solo puede elegir entre los marcos que su empresa tiene contratados (también fijo: SOC 2).

**Qué cambia respecto a lo anterior:** `modelo-datos.md` §6.1 decía *«se vetó a propósito el framework a nivel de
empresa; los marcos se contratan por servicio»*. Ese veto era sobre que **el cliente** lo eligiera en su Componente
1, y sigue en pie. Lo que se añade es una capa **comercial** anterior: quién vende el marco es Monkey Admin, y el
servicio solo **elige** entre lo vendido. El contrato del Componente 2 ya traía un error `FRAMEWORK_NOT_CONTRACTED`
que apuntaba a esto y que D45 había dejado sin uso.

**Cómo quedó:**

1. **`platform.company_frameworks`** (migración 26): `company_id`, `framework_id` (la versión vigente), `contracted_by`
   (el `admin_monkey` que lo contrató), `contracted_at`; único `(company_id, framework_id)`.
2. **RLS:** la empresa **lee** lo suyo y `admin_monkey` lee todo; **solo `admin_monkey` escribe**. Un cliente no puede
   contratarse un marco ni con acceso directo a la base (probado como `monkey_app`).
3. **`POST /v1/companies`** acepta `framework_codes` (opcional, por defecto `["soc2"]`); empresa, clave y contrato
   se crean en **la misma transacción**. Un código fuera del catálogo → `422`. Las respuestas del registro, del listado
   y del detalle traen `frameworks`.
4. **`POST` / `PATCH /v1/services`**: un marco no contratado → `409 FRAMEWORK_NOT_CONTRACTED`. Editar otros campos de un
   servicio no se bloquea.
5. **`GET /v1/catalogs/contracted-frameworks`** (solo `admin_empresa`): lo que el cliente puede elegir. Una empresa sin
   contrato recibe una lista vacía y la pantalla se lo explica.
6. **Pantallas:** Monkey Admin muestra «Marco contratado: SOC 2 (fijo por ahora)» en el registro y el marco de cada
   empresa en el listado; Monkey Platform muestra SOC 2 como tarjeta fija «incluido en tu contrato».
7. **`service_frameworks` no cambia:** sigue guardando qué marco persigue cada servicio, con su versión de catálogo y su
   periodo de evaluación (A4).

**Deja abierto** (en `deuda-tecnica/README.md`): no hay forma de contratar o cancelar un marco después del registro (DT-26) y el
contrato no guarda condiciones comerciales (DT-27). Las empresas que existían antes de la migración no tienen contrato; en
desarrollo no había ninguna.

**Por qué:** con un solo marco hoy el cambio es pequeño, pero fija el orden correcto para cuando haya más (ISO 27001,
PCI DSS, HIPAA en la Fase 1): lo que un cliente puede declarar lo decide lo que Monkey le vendió, no un campo libre.

**Fuente:** confirmación de Carlos, 2026-10-01.

---

## D48 · Paso 3 del control técnico: lo verificado contra la sonda real y por qué el flujo actual es provisional

**Qué se verificó** (Carlos y desarrollo, 2026-10-02, con el `.env` de pruebas y la documentación pública de la sonda):

1. **Monkey no instala ni se conecta a los equipos del cliente.** El agente corre en el equipo del cliente, habla **hacia
   afuera** con el manager (1514/1515) y las pruebas de configuración (SCA) corren **en el agente**. Lo que Monkey lee es lo que
   el manager ya tiene: su base y su API. La base de referencia del repo (`prueba_wazuh`: `cis_checks`, `cis_check_results`,
   `wazuh_agents`) es el destino de esa sincronización; no tiene columna de empresa y guarda solo la última foto.
2. **Las integraciones de AWS y Azure de la sonda son ingestión de registros**, no evaluación de la configuración de la cuenta.
   No equivalen al modelo de Vanta (rol entre cuentas en AWS, federación de identidad en GCP, registro de aplicación en Azure,
   sin contraseñas).
3. **El aislamiento entre clientes no lo da la sonda.** La clave de inscripción es global y el agente puede declarar su propio
   grupo: Monkey debe imponer que un agente solo se asocie a la empresa que lo inscribió. La API permite roles de solo lectura
   por grupo.
4. **Cobertura real de plataformas hoy:** 3 políticas (Ubuntu 22.04, Ubuntu 14.04, Windows 11). Cualquier otro sistema no tiene
   pruebas de configuración.
5. Desde la máquina de desarrollo la API de la sonda no respondió (todos los puertos): probable lista de IP permitidas. No se
   envió ninguna credencial.

**Consecuencia:** el formulario actual del paso 3 (credenciales por conexión: rol de lectura, usuario de base, llave SSH) lo
definió desarrollo (D46, DT-4) **antes** de esta verificación y **no coincide** con el modelo real. Se deja como está y se
declara provisional; no se promete a ningún cliente. Qué cambia y en qué orden queda como pendiente del comité (**P12**) y como
deuda (**DT-31 a DT-36**).

**Por qué no se cambió ya:** rediseñarlo sin saber quién instala los agentes, cómo se asigna cada cliente a su grupo y quién
configura la nube sería inventar; el brain manda y ante un vacío se pregunta.

---

## D49 · Las peticiones esperan hasta 10 s por una conexión del pool

`PrismaService.withScope` fija `maxWait` en 10 s (antes 2 s por defecto). Con la base remota a ~200 ms por consulta, una ráfaga
de peticiones paralelas agotaba la espera y el cliente recibía `500 INTERNAL_ERROR` («Unable to start a transaction in the
given time») aunque la base estuviera sana; ocurría hasta en los endpoints públicos de catálogos. Ahora se encolan. No cambia el
límite de duración de la transacción (`timeoutMs`).

**Fuente:** hallazgo de las pruebas de navegador, 2026-10-02.

---

## D50 · Todos los marcos se ofrecen, solo SOC 2 se contrata; cada marco con sus categorías

**Decisión** (comité, correcciones del 2026-10-05; categorías confirmadas por Carlos). Cuatro puntos:

1. **Se ofrecen 7 marcos y solo SOC 2 se puede contratar.** Monkey Admin y la pantalla del servicio muestran todos como
   gancho comercial (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF y SOC 1, en orden de demanda), pero **solo se habilita lo
   que está construido** (hoy, SOC 2) y, en el servicio, lo que la empresa contrató. Si el cliente toca un marco que no tiene
   contratado, no se selecciona: se abre un aviso que lo invita a hablar con mercadeo (mock, DT-41).
2. **`catalog.frameworks.availability`** (`available` | `coming_soon`, migración `20261005220000_correcciones_onboarding_d50_d51`): `soc2` es `available`; los otros seis se
   siembran con `npm run reference:load` como `coming_soon` y **sin requisitos ni controles**. El registro de empresa rechaza un
   `coming_soon` con `409 FRAMEWORK_NOT_AVAILABLE`. `GET /v1/catalogs/frameworks` los trae todos, con `availability`.
3. **Qué marcos y por qué esos.** Los más demandados hoy: SOC 2 es el estándar del SaaS B2B; ISO 27001 es la expansión más
   común (32 % de los clientes de Drata con SOC 2 la suman), seguida de HIPAA (20 %) y GDPR (19 %); PCI DSS lo exigen fintech y
   pagos; NIST CSF es el marco de referencia citado en Colombia; SOC 1 es el hermano financiero de SOC 2. Los siete tienen ficha
   en `frameworks/*.md`. Se dejan fuera CIS Controls (vetado) y FedRAMP, CMMC, DORA y NIS2 (nicho o de otra región).
4. **Categorías: cada marco usa las suyas (opción 2).** ISO 27001:2022 se organiza en 4 temas, PCI DSS en 12 requisitos y NIST
   CSF 2.0 en 6 funciones; forzarlas a las 5 categorías de SOC 2 (seguridad, disponibilidad, confidencialidad, integridad,
   privacidad) distorsiona la cobertura y la lectura del auditor, y ISO ni siquiera tiene un tema «disponibilidad». Es coherente
   con el principio de que el **control es atómico e independiente del marco**: los controles no cambian, solo cómo se agrupan
   los requisitos de cada marco. **La base actual no permite la opción 1** ni sin migrar: `requirements.trust_criterion_id` es una
   FK a un enum de 5 valores.

**Qué no se hizo y por qué:** no se migró el schema. Con SOC 2 como único marco construido, generalizar `trust_criteria` a
dominios por marco sería un cambio grande sin uso. Queda como **DT-38**, y se hace al sembrar el primer marco que no sea SOC 2:
`trust_criteria` → dominios con `framework_id`, `code`, `name` e `is_mandatory`, y `service_trust_criteria` →
`service_framework_domains` (la regla «seguridad siempre» pasa a ser `is_mandatory` del dominio).

**La pantalla del marco:** el texto dice **consultoría**, no auditoría (Monkey acompaña al cliente; no audita). Cada categoría de
SOC 2 trae qué significa y qué se revisará (sin códigos técnicos, `philosophy.md`). Si el cliente no selecciona todas las
categorías, se le avisa que lo recomendable es cubrirlas todas; si decide continuar, se respeta.

**Fuente:** correcciones del comité del 2026-10-05; Carlos confirmó la opción 2 y la lista de marcos. Demanda: Drata (clientes con
SOC 2), ACC 2025, guías sectoriales de cumplimiento.

---

## D51 · Correcciones al Componente 2 y a la activación de cuenta (2026-10-05)

**Decisión** (comité, confirmada por Carlos). Revierte parte de D45 y D43:

1. **Activación en dos pasos y sin nombre.** El primer paso pide solo el código y, al comprobarlo
   (`POST /v1/auth/redeem/lookup`), muestra la razón social y el correo que Monkey Admin ya fijó; el segundo pide solo la
   contraseña y su confirmación. El administrador se identifica por su correo: **`users.name` y `users.last_name` pasan a
   ser opcionales** y `redeem` ya no los recibe. El nuevo endpoint es público y revela razón social y correo a quien tenga el
   código, así que tiene un freno de 10 fallos / 15 min por dirección compartido con el canje (DT-37); antes, `redeem` no tenía
   ninguno.
2. **La regulación ya no se declara por servicio.** Las leyes de protección de datos aplican a la **empresa**, y ya se declaran
   en el Componente 1 (`organization_regulations`). Se retira `service_regulations` (misma migración `20261005220000`), `regulation_codes` del
   servicio y su pregunta. Revierte D45 (que la había añadido «por analogía»). Quedan 12 campos obligatorios.
3. **La lista de regulaciones solo trae normas de protección de datos.** Salió PCI DSS (estándar de la industria de tarjetas,
   no una ley; ya es un marco). HIPAA y GLBA se quedan: son leyes sectoriales de EE. UU. que protegen datos de salud y
   financieros. Entraron la Ley 21.719 de Chile (vigente desde el 1-dic-2026, reemplaza a la 19.628) y las de Uruguay (18.331),
   Ecuador (LOPDP), Panamá (Ley 81) y Costa Rica (8968): 18 en total. La migración borra la marca PCI DSS de las empresas que la
   habían elegido. **Falta que el comité ratifique la lista** (DT-40).
4. **Descripción del Sistema: enlace, archivo, o los dos.** `system_descriptions.file_path` se reemplaza por `link_url` y
   `file_key` (ambos opcionales, `CHECK` de que haya al menos uno). El archivo (PDF o .docx, 25 MB, validado por extensión y por
   firma) se guarda en S3 / minio detrás del puerto `FileStorage`; sin `S3_*` la app arranca y la subida responde 503. Como el
   archivo necesita el servicio, `system_description` pasa a ser **opcional al crear**: con archivo se crea el servicio y
   luego se sube. La llave del objeto nunca sale; se baja con un enlace temporal de 5 minutos. Se borra el objeto al reemplazarlo
   y al eliminar el servicio. **No está probado contra el minio real** (DT-39).
5. **El nombre del proveedor ya no se pregunta** (el tipo —AWS, Azure…— ya lo dice). `subservice_organizations.provider`
   sigue existiendo y opcional; hoy no se captura.
6. **Certificación previa:** pasa de 4 a 8 valores (SOC 2, SOC 1, ISO 27001, PCI DSS, HIPAA, NIST CSF, GDPR, ninguna), preguntando
   por una «certificación o evaluación» porque algunos no se certifican como tal.

**Por qué:** el comité revisó el onboarding con el producto delante y pidió estos ajustes; ninguno contradice una regla del modelo
(el control sigue siendo atómico, el cumplimiento se sigue derivando).

**Fuente:** correcciones del comité del 2026-10-05, pasadas por Carlos el mismo día.

---

## D52 · La auditoría se escribe en la misma transacción que la acción (cierra DT-28, SEG-36)

**Decisión** (desarrollo, 2026-10-07; **pendiente de ratificar con el comité**; no cambia el modelo de datos). D41 y
`contracts/conventions.md` ya exigían que el rastro se escribiera en la misma transacción que la acción. No se cumplía: los
casos de uso llamaban al repositorio y **después** al escritor de auditoría, en otra transacción y con el error tragado. Si
fallaba entre las dos, la acción quedaba sin rastro.

**Cómo quedó:**

1. **`AuditIntent<T>`** (`common/audit/audit-log.writer.ts`): una función `(resultado) => AuditEntry | AuditEntry[]` que el caso de
   uso construye con lo que ya sabe (usuario, IP, estado anterior) y **entrega al repositorio**. El repositorio, dentro de la
   transacción que ya abre con `withScope`, escribe el efecto, arma el resultado y llama a `insertAuditLog(tx, audit(resultado))`.
2. **El parámetro es obligatorio** en todo método que cambia datos: servicios (crear, modificar, descripción, eliminar),
   contexto organizacional, empresa, escenario y alcance, activos (registrar, validar, activar, programar), sesión (login y
   logout) y canje de la clave. Un método nuevo sin él no compila.
3. **Falla cerrado:** si el insert del rastro falla, **toda la acción se revierte** y la respuesta es un `500`. Es la lectura
   correcta de SOC 2 (CC7.2, CC9.2): una acción sin rastro es peor que una acción rechazada.
4. **Dónde NO aplica**, a propósito: (a) los **intentos fallidos** (`auth.login_failed`, canje fallido): no hay efecto con el que ser
   atómico y no deben romper la respuesta, así que siguen con `AuditLogWriter.write`, de mejor esfuerzo; (b) los **cierres
   automáticos de sesión** (inactividad, expiración, usuario inactivo): se pasa `null` explícito y hoy no se registran (**DT-47**).
5. **Una validación fallida de un activo sí es un cambio** (pasa la conexión a `failed`): su rastro `result = error` se escribe en
   la misma transacción.

**Alternativas descartadas:**

- **Transacción ambiental** (`AsyncLocalStorage` + `withScope` que se une a la abierta): menos cambios en los casos de uso, pero
  oculta cuándo hay transacción, y el repositorio del canje atrapa un error de la base (`P2002`) para devolver `email_taken`; unido
  a una transacción externa, el error la dejaría abortada. Se prefirió el parámetro explícito.
- **Dejar el escritor aparte con reintento:** no da atomicidad, solo disminuye la ventana.

**Qué cuesta:** una caída de `audit_logs` ahora **detiene** las acciones que cambian datos (disponibilidad a cambio de
integridad del rastro). `audit_logs` es la misma base que los datos, así que no hay un punto de fallo nuevo en la práctica.

**Cómo se comprueba:** `Backend/test/auditoria/audit-atomica.e2e-spec.ts` (19 pruebas). Fuerza que el rastro se inserte y luego
falle, y comprueba que no queda ni el efecto ni la fila. Una mutación que escribe el rastro después de confirmar el cambio hace
fallar la prueba correspondiente.

**Fuente:** D41, `contracts/conventions.md` («Se escribe en la misma transacción que la acción»), DT-28 y MD-113.

---

## D53 · Conexión con la nube: alcance, activo, regiones, canales y retención (2026-10-07)

**Decisión** (Héctor, desarrollo, 2026-10-07; **pendiente de ratificar con el comité**). No cierra `P14` A1 (el rol de cada motor sigue
abierto) ni D13; fija lo que desarrollo puede construir y probar sin esperar esa respuesta.

1. **Alcance de esta etapa: AWS, GCP y Azure.** Las integraciones con GitHub, Okta, M365 y demás SaaS quedan fuera hasta nuevo aviso.
2. **El activo en la nube es la cuenta** (AWS), la suscripción (Azure) o el proyecto (GCP). Los recursos hallados (instancias, volúmenes,
   grupos de seguridad, trails…) son **hijos** del activo y llevan su identificador del proveedor. Responde `P14` B1.
3. **Solo se evalúan las regiones que el cliente declare.** Un check de cuenta repetido por región cuenta como **una** evaluación;
   un check por recurso, una por recurso. Responde `P14` B3 y cierra la parte de DT-45 sobre regiones.
4. **El cliente elige el canal de conexión por activo** entre los que existen para esa categoría (rol de solo lectura, agente,
   claves), y Monkey lo guía; no se impone solo el más seguro. Se guarda como dato (`connection_method`). Un canal donde el cliente
   *empuja* datos de sistemas propios no existe en el catálogo del comité (`ac_01` a `ac_06`): queda **LATER** y se pregunta al comité.
5. **Retención de `check_results` en dos niveles** (propuesta que cierra la decisión de DT-48): corridas completas por un periodo corto
   (90 días por defecto) y, para el histórico largo (7 años), solo las **transiciones de estado** más un resumen diario.
   **Se pregunta al comité** si un auditor exigiría corridas completas más allá del periodo corto.

**Fuente:** conversación de desarrollo del 2026-10-07; `P12`, `P14`, DT-44, DT-45, DT-48.

## D54 · La sonda de servidores: un manager, un grupo por cliente, agente pre-registrado por Monkey (responde P12.2; 2026-10-07)

**Decisión** (Héctor, 2026-10-07; **pendiente de ratificar con el comité**; no cambia el modelo). El aislamiento entre clientes
(`DT-33`, `SEG-45`) se logra con **un solo manager y un grupo por cliente**, no con un manager por cliente (costoso en recursos).
Monkey **pre-registra** cada agente por la API del manager, le asigna el grupo del cliente y entrega la clave en el comando de
instalación; el agente no se inscribe por su cuenta ni declara su grupo. Al sincronizar, Monkey solo acepta resultados de agentes cuyo
grupo corresponda al `tenant_id`. **A verificar contra la documentación de la versión vigente** que la API soporta ese flujo.

**En desarrollo,** el motor de nube y el manager corren en contenedores en la VPS de desarrollo (7,6 GB de RAM; un manager sin
indexador ni dashboard cabe). `MANUAL → not_run` ya lo maneja el modelo y no requiere cambios.

## D55 · Entorno de desarrollo del control técnico: motor de nube y manager en la VPS (2026-10-08)

**Decisión** (Héctor, 2026-10-08; desarrollo; **pendiente de ratificar**; no cambia el modelo de datos). Lo verificado:

1. **Motor de nube:** contenedor efímero (`toniblyx/prowler:5.44.0`) en la VPS de desarrollo, con 2 GB de memoria y 2 CPU. Un escaneo
   completo de AWS (655 checks, 2 regiones) tardó unos 2 minutos. Las llaves se pasan por la entrada estándar (`--env-file /dev/stdin`),
   no se escriben en disco ni en el repo, y el contenedor se elimina al terminar (el `docker inspect` las conserva).
2. **Manager de la sonda:** `wazuh/wazuh-manager:4.14.6` (la versión de la sonda de pruebas), **sin indexador ni dashboard**, con ~0,5 GB
   de memoria en reposo y límite de 2 GB. La API (55000) escucha solo en `127.0.0.1`; solo el puerto de agentes (1514) está publicado.
   La contraseña de la API se generó en el servidor (`~/wazuh-manager/.env`, modo 600).
3. **D54 verificado:** la API pre-registra un agente (`POST /agents/insert` devuelve `id` y `key`) y se le asigna un grupo
   (`PUT /agents/{id}/group/{grupo}`). El enrolamiento abierto (1515) **no se publica**: no hace falta si Monkey entrega la clave.
4. **Lo que NO está resuelto:** el firewall de la VPS está inactivo y el SSH acepta contraseña; MinIO está publicado a todo internet.

**Fuente:** conversación de desarrollo del 2026-10-08; D53, D54, P12, P14, DT-33, DT-43.

## D56 · El control técnico de la nube en el modelo: recurso hijo, procedencia del mapeo y checks sin filas (2026-10-08)

**Decisión** (Héctor, 2026-10-08; desarrollo; **pendiente de ratificar con el comité**). Concreta D53 en el schema y fija cómo entra
el motor de nube al modelo sin romper el control atómico (el control no cuelga de un motor ni de un marco).

1. **`asset_resources`** (nueva, `tenant`, con RLS): el recurso hallado dentro de un activo de nube, único por `(asset_id, resource_uid)`.
   `check_results` lo referencia (`asset_resource_id`) y gana `region`, `status_detail` y `engine_severity`. Es la variante **normalizada** de
   lo que DT-44 proponía (columnas de recurso en `check_results`): el recurso no se repite en cada resultado.
2. **`executions`** gana `engine_version`, `regions` y `checks_executed`. **Un check que el motor no devuelve es `not_applicable`** (la cuenta
   no tiene esos recursos), no «no ejecutado»: el conjunto ejecutado es el catálogo de esa versión. Una corrida de AWS ejecutó 655 checks y
   solo 139 devolvieron filas.
3. **Procedencia del mapeo** (`mapping_provenance`: `engine_native` · `monkey_proposed` · `committee_ratified`) en `check_mappings` y `test_checks`.
   `test_checks` gana también `confidence` y `rationale`. **Gana siempre el comité**; el seed no pisa una asignación ratificada.
4. **El mapeo a SOC 2 va por la prueba**, no check → requisito: check → prueba → control → punto de enfoque → requisito. Se cargan 662 checks,
   3.413 mapeos del motor a los 6 marcos ofrecidos (D50) y 569 asignaciones propuestas a las pruebas `T-CLD`. De los 171 checks que el
   marco SOC 2 del motor lista, 165 reciben una prueba; 133 de las 569 asignaciones están corroboradas por ese mapeo. **104 checks no
   encajan en ninguna prueba de nube y quedan como cobertura no alcanzada**; no se fuerzan.
5. **`checks`**: `engine_native` es un origen nuevo; `title_es` y `verification_rule` pasan a anulables (el motor solo trae inglés y no tiene
   regla propia: no se inventa). `assets.external_account_id` guarda la cuenta de AWS, suscripción de Azure o proyecto de GCP.
6. **Los textos del motor son internos** (P11, P14 D3): nombran al proveedor en algunos casos y no salen al cliente.

**Fuente:** D53, D13, P14, DT-44, DT-50; escaneo del 2026-10-08 (`control-tecnico/cruce-nube-aws.md`). **Migraciones:**
`20261008120000_cloud_technical_control_model` y `20261008120100_rls_asset_resources`. **Seed:** `npm run cloud:extract|load|verify`.

## D57 · Quién ejecuta el motor de nube: un trabajador aislado (2026-10-09)

**Decisión** (Héctor, 2026-10-09; desarrollo; **pendiente de ratificar con el comité**; no cambia el modelo de datos). «Evaluar ahora» y las
corridas programadas las ejecuta un **trabajador separado del backend** (opción A de las tres consideradas):

1. El backend **no toca Docker**. Descartado montar el socket de Docker en el backend (le daría control del servidor).
2. «Evaluar ahora» crea una ejecución `queued`. El trabajador la **reclama**, asume el rol del cliente, lanza el motor en un contenedor
   efímero por cliente y por corrida con **credenciales temporales** (SEG-46), y entrega el resultado al backend por una API **interna**
   (SEG-47). El backend lo interpreta y lo guarda (la persistencia de D56). Una corrida que no conecta queda `failed`: es un problema de
   conexión, no un incumplimiento.
3. **Reclamar sin tenant** necesita buscar entre empresas, y RLS lo impide por diseño: se hace con una función `SECURITY DEFINER`
   angosta y con `search_path` fijo, el mismo patrón de las búsquedas previas al tenant (SEG-08).
4. **Dev:** el trabajador corre en la VPS de desarrollo y asume el rol con las llaves de una cuenta de pruebas, que hace de «Monkey».
   **Producción:** una identidad propia de Monkey, sin llaves guardadas (DT-43).

5. **Un activo no puede tener dos ejecuciones abiertas**, impuesto por un índice único parcial en la base. El reclamo y el barrido por
   timeout **no dejan rastro** (los hace la función SQL; son frecuentes y no son una acción de usuario, igual que DT-47); sí lo dejan «evaluar
   ahora», el cierre completado y el cierre fallido, en la misma transacción que su efecto (SEG-36).

**Alternativas descartadas:** el backend lanzando el contenedor (B) y solo importar un escaneo ya hecho (C), que sirve para una demo pero
no es «evaluar ahora».

**Fuente:** `P14` C, D53, D56, DT-43, SEG-46, SEG-47.

**Cómo quedó construido (2026-10-09, `Backend/src/runner/`):**

1. **Un entrypoint más de la misma base de código y de la misma imagen del backend** (`node dist/src/runner/main.js`): sin segundo lenguaje, sin
   `Dockerfile` ni pipeline nuevos. Capas propias: dominio (tipos y puertos `RunnerApi`, `CredentialBroker`, `ScanEngine`), un caso de uso
   (reclamar → credenciales → motor → entregar) y adaptadores (HTTP hacia `/internal/runner`, STS de AWS, Docker). No importa nada de
   `src/features`: habla con el backend solo por HTTP, y **no tiene acceso a la base de datos**. Escalar es subir réplicas (el reclamo usa
   `FOR UPDATE SKIP LOCKED`); correr el motor en la nube es escribir otro `ScanEngine`.
2. **El motor es una caja negra** en una imagen fijada por versión o digest (el trabajador se niega a arrancar con `latest`). Cada corrida: un
   contenedor efímero, sin capacidades, sin escalada de privilegios, sin montajes del servidor, memoria/CPU/procesos acotados, en la red por
   defecto de Docker (no la del backend: sin acceso a la API ni a la base) y **siempre eliminado**. El resultado se lee del propio contenedor.
3. **Credenciales:** el trabajador asume el rol del cliente con su `ExternalId` y entrega al motor credenciales **temporales** (1 hora). Rechaza un
   rol de otra cuenta que la declarada. Las regiones se validan con una expresión estricta antes de llegar a la línea de comandos del motor.
4. **Infraestructura** (`Backend/deploy/`): `docker-compose.dev.yml` versionado, con dos servicios nuevos (`docker-proxy` y `runner`), solo en la red
   `default` y sin puertos publicados. El trabajador recibe un entorno **aparte** (`runner.env`, en el servidor; antes, secreto `RUNNER_ENV_FILE`) con solo lo suyo. El
   workflow solo lo levanta si el compose de la VPS ya lo define.
5. **Verificado:** pruebas automáticas contra Docker real, contra el backend real y contra AWS real (una corrida completa con el motor real el
   2026-10-09: credenciales `ASIA…`, 429 filas, sin contenedores sobrantes, mismo resultado que el escaneo con llaves).

**Razones de fallo** (claves i18n que guarda `executions.failure_reason` y verá el cliente): `connection.role_not_found`, `connection.account_mismatch`,
`connection.credentials_invalid`, `connection.regions_missing`, `connection.not_configured`, `connection.provider_not_supported`,
`connection.method_not_supported_by_runner`, `execution.engine_failed`, `execution.engine_timeout`, `execution.output_invalid`, `execution.timed_out`.
Una prueba exige su texto en español e inglés y que ninguno nombre a un proveedor.

## D58 · El flujo de conexión de una cuenta de nube: validación real a través del trabajador (2026-10-09)

**Decisión** (Héctor, 2026-10-09; desarrollo; **pendiente de ratificar con el comité**). Concreta D53 y D57 para lo que el cliente hace en pantalla:
registrar su cuenta de AWS, darle a Monkey acceso de solo lectura y comprobar que funciona.

1. **El backend nunca toca la cuenta del cliente ni guarda llaves de AWS.** «Comprobar conexión» encola una **validación** y el trabajador (el único
   componente con identidad en AWS) asume el rol y comprueba que la cuenta es la declarada. El backend espera el resultado unos segundos, así que la
   pantalla recibe una respuesta síncrona (`PROBE_MODE=runner`). Si nadie atiende: `503` «no disponible», la validación se cancela y el activo no queda
   bloqueado; no es culpa del cliente y la conexión no cambia de estado.
2. **Dos tipos de ejecución, dos carriles** (`executions.kind`: `validation` y `assessment`). Una validación (segundos, con un cliente esperando) no
   puede quedar detrás de una evaluación de minutos: el trabajador corre un bucle por tipo. Una validación abierta más de 2 minutos se da por perdida;
   una evaluación, a los 30.
3. **Dos canales de conexión reales para AWS:** *rol de solo lectura* (recomendado: el cliente no comparte secretos, crea en su cuenta un rol con una
   plantilla y entrega su ARN) y *llaves de acceso* (menos seguro, con aviso, cifradas y nunca devueltas). El tercero, el *agente*, solo existe como
   diseño: no se afirma que verifique nada.
4. **ExternalId generado por Monkey, por activo** (`mk-…`), guardado en `asset_provisionings.external_id`. No es un secreto del cliente: evita que otro
   cliente de Monkey use el rol de este. El cliente lo pega como parámetro de la plantilla junto con la identidad de Monkey
   (`MONKEY_AWS_PRINCIPAL_ARN`, configuración).
5. **La plantilla se descarga** (`GET /v1/connection-templates/aws-readonly-role`, el código es su única fuente) y se crea en CloudFormation a mano. El
   enlace de «un clic» exige alojarla en S3 y queda para después (`DT-55`).
6. **Nada se hardcodea en la pantalla:** las regiones (`aws_region`) y los canales (`connection_method`) salen de los catálogos del backend; el alta solo
   acepta las regiones ofrecidas; los pasos de instrucciones y los motivos de fallo llegan ya traducidos (la plataforma no tiene i18n propio, `DT-21`).
7. **El formulario provisional del paso 3 sigue aceptándose** en la API (sin `connection_method`) hasta retirarlo (`DT-31`, `DT-56`); la pantalla ya no lo usa
   para la nube.

**Verificado** (2026-10-09): pruebas automáticas (31 de conexión, por HTTP) y una corrida real de punta a punta con **navegador, backend, trabajador y
AWS reales**: alta → instrucciones → plantilla descargada → fallo con identificador equivocado (mensaje claro) → validación correcta → activación →
evaluación (429 filas, ~3 min) → «Evaluación completada»; y el canal de llaves, validado sin que la llave aparezca en la página ni en ninguna respuesta.

**Fuente:** D53, D56, D57, `contracts/modules/control-tecnico-operacion.md`, SEG-46, SEG-47, SEG-50.

## D59 · La conexión descubre los activos de la cuenta y los muestra al cliente (2026-10-10)

**Decisión.** El comité aprobó que, al conectar, el cliente **vea los activos que la conexión reconoció** (no solo «la conexión funciona»). Se
evalúa cumplimiento sobre activos, no sobre conexiones.

1. **Cuándo.** Dentro de la **validación** (D58): el trabajador, ya con el rol asumido, lee el inventario de la cuenta y lo entrega junto con el cierre
   de la validación. Son lecturas de segundos, no el motor de minutos. Volver a comprobar la conexión **refresca** el inventario.
2. **Qué lee.** Servidores (EC2), bases de datos (RDS), almacenamiento (S3) y funciones (Lambda), **solo en las regiones declaradas** (D53). No necesita
   permisos nuevos: `SecurityAudit` y `ViewOnlyAccess` ya los cubren. Un servicio que no se puede leer **no tumba la validación**: se anota como
   «inventario incompleto» (no «vacío»).
3. **Dónde vive.** El activo sigue siendo la **cuenta** (D53); lo encontrado cuelga de él en `asset_resources`, que gana `kind` (`server`, `database`,
   `storage`, `function`, `other`; catálogo `resource_kind`) y `attributes` (JSON con lo que se pudo leer). `asset_provisionings.inventory_at` marca el
   último descubrimiento: **solo se muestra lo visto en él**, y solo de las regiones declaradas. Lo que ya no aparece no se borra (sus resultados
   siguen siendo evidencia). `kind = other` son recursos que solo conoce la evaluación (usuarios, políticas…) y **no** se muestran como activos.
4. **El sistema operativo es una inferencia.** AWS no dice el sistema operativo de una máquina; dice la **imagen** con la que se lanzó. Se infiere
   (`Ubuntu 22.04`, `Amazon Linux 2023`…) y se guarda con `os_source = image`; si la imagen no se puede leer o no se reconoce, queda **sin decir**
   (`DT-59`). La versión exacta llega con el canal de agente (`DT-57`).
5. **Seguridad.** Solo lectura; el error del proveedor nunca se registra ni se devuelve (puede traer datos de la cuenta); los atributos que entrega el
   trabajador se limpian (valores simples y cortos) antes de guardarse; máx. 500 recursos.

**Migración:** `20261010120000_resource_inventory`. **Contrato:** `GET /v1/assets/{id}/resources` en `contracts/modules/onboarding-technical-control.md`.
**Fuente:** D53, D56, D58, SEG-51.

## D60 · Se retira el scope declarado («cuántos tienes») y el servicio muestra sus conexiones (2026-10-10)

**Decisión (producto).** Se elimina por completo el paso «¿Cuánto tienes?» del Componente 3: **no aportaba nada**. El cliente ya no declara cuántos
servidores, nubes, aplicaciones, bases de datos o equipos tiene; lo que tiene lo **ve al conectar** (D59). Por eso se retira del modelo y de la pantalla:

1. **Modelo:** se elimina la tabla `scopes` (migración `20261010130000_drop_declared_scope`) y sus relaciones con `services` y `companies`. Se retiran
   `PUT /v1/services/{id}/scope`, la acción de auditoría `service.scope` y el cálculo «declaraste X, conectaste Y». **DT-6 queda cerrada** (ya no hay
   contadores que reconciliar con las dimensiones).
2. **El paso 3 del onboarding** se da por hecho con el **escenario de despliegue** del servicio (antes: escenario *y* scope). `GET /v1/services` pasa de
   `technical_control.has_scope` a `technical_control.connection_count` (cuántas conexiones activas tiene el servicio).
3. **Pantallas.** Se retira el asistente de tres pasos. El **servicio** tiene su detalle (`/services/{id}`): su información ordenada, «dónde vive» y la
   **lista de conexiones**; las conexiones se crean en `/services/{id}/connections/new` (donde se proponen los métodos) y cada conexión tiene su detalle
   (`/services/{id}/connections/{id}`) con los **activos que encontró**. La edición del servicio pasa a `/services/{id}/edit`.

**Nota.** `scopes` figuraba en el modelo del comité (§6.3, C3). Se retiró por **decisión de producto del equipo (2026-10-10)**; conviene que el comité
la conozca, pero **no bloquea** nada. **Migración destructiva:** borra los contadores ya capturados; en dev se aplica con el deploy (el backend anterior
todavía lee la tabla).
**Fuente:** D46, D59.

## D61 · Cada recurso descubierto es un activo del cliente, y el servicio elige cuáles son suyos (2026-10-10)

**Problema.** D53 dejó la **cuenta** como único activo, y D59 mostraba todo lo que había dentro. Pero una cuenta puede tener recursos que no son del servicio que el cliente
quiere evaluar, o ser de varios servicios, y al cliente no le servía una lista de «Ubuntu 24.04» repetidos para distinguirlos.

**Decisión (producto, la opción más fiel al modelo del comité).**
1. **La conexión sigue siendo la cuenta** (`ac_01`): lleva el rol o las llaves, las regiones y el ExternalId.
2. **Cada recurso que descubre es un `asset` propio** (`origin = discovered`): servidor `ac_02`, base de datos `ac_03`, almacenamiento y funciones `ac_01`. Lleva su
   código `AST-####`, su IP (`ip_address`), su zona (`location`), sus etiquetas (`tags`), su `platform` (sistema operativo o motor) y su criticidad. Se enlaza a su
   conexión con `assets.parent_asset_id`, y a su recurso técnico con `assets.resource_id` (1:1). `asset_resources` **se queda** como el registro técnico que
   referencian los resultados de la evaluación (D56): no se toca.
3. **El servicio elige sus activos:** `service_assets` (el puente que el comité ya definió) enlaza cada activo descubierto a los servicios a los que da soporte, sin
   duplicarlo. **Por defecto no hay ninguno enlazado**: el cliente decide. Lo que no se enlaza queda visible como «no incluido».
4. **Lo que desaparece de AWS** pasa a `inactive` y **se desenlaza** de los servicios; no se borra (sus resultados son evidencia). Si un servicio de AWS no se pudo leer en ese
   descubrimiento, sus activos **no** se dan por desaparecidos. Volver a descubrir **no pisa** la criticidad ni el responsable que fijó el cliente.
5. **La evaluación sigue corriendo por cuenta** (así trabaja el motor), pero **el estado de preparación de un servicio mide solo sus activos**
   (`GET /v1/assets/{id}/readiness?service_id=`): se dejan fuera los resultados de activos de la conexión que **no** son del servicio. Lo que no tiene activo propio
   (usuarios, políticas, el registro de actividad: lo de toda la cuenta) **cuenta para todos los servicios que usan esa cuenta**.
6. **Dar de baja una conexión da de baja a sus activos** (`inactive`) y los desenlaza de los servicios; su historial se conserva.
7. **Los activos descubiertos no son conexiones:** no salen en `GET /v1/assets` (solo conexiones), no cuentan en `connection_count`, y no se validan, activan, programan
   ni editan por su cuenta (404).

**Migración:** `20261010140000_discovered_assets`. **Contrato:** `onboarding-technical-control.md` (`GET …/resources`, `PUT /v1/services/{id}/connections/{id}/assets`).
**Fuente:** D53, D56, D59, `modelo-datos.md` §6.3 (`assets`, `service_assets`), SEG-53.

---

## D62 · El cumplimiento se cuenta: dimensión → control → categoría → marco (2026-10-09)

**Decisión.** El responsable de producto fijó la fórmula, basada en cómo se mide SOC 2 (5 categorías, compuestas por controles, que se
evalúan con tests en 5 dimensiones). Cada nivel cuenta lo cumplido contra el total del nivel y **se cumple solo al 100%**:

- **Dimensión de un control:** cumple solo si todos sus tests con resultado, sobre todos sus activos aplicables, cumplen.
- **Control:** % = dimensiones que cumplen / dimensiones aplicables. Con una falla de cinco, 80% y no cumple.
- **Categoría:** % = controles que cumplen / controles aplicables (5 de 10 fallan → 50%; 45 de 156 fallan → 71,15%). Se logra solo al 100%.
- **Marco del servicio:** % = categorías logradas / categorías **contratadas** (1 de 5 → 20%; 1 de 2 → 50%). Una categoría sin controles aplicables se anula y no entra.
- **Solo se mide lo que ya tiene resultado.** Un test `pending` o `not_applicable` no afecta ningún cálculo hasta que tenga un resultado.
- **Una categoría con controles aplicables pero ninguno medido no está lograda** y cuenta en el denominador del marco; sin ningún control aplicable, se anula.
- **Cobertura:** siempre un número aparte al lado del porcentaje. Un 100% con algo pendiente se muestra como «100% de lo medido» y nunca como Preparado.
- **El activo** se lee con la misma regla: tests con resultado cumplidos / tests con resultado, con los cortes de 100% y 80%.
- **Pesos iguales** en todos los niveles. No hay porcentaje de la empresa.
- **Semáforo:** Preparado = 100% · Casi listo = de 80% a menos de 100% · Requiere trabajo = menos de 80%.
- **Vocabulario:** *dimensión* es solo el eje técnico (documental, servidores, bases de datos, aplicación, nube); *categoría* es solo el criterio de confianza.

**Por qué.** Una certificación solo se emite con todo en regla, así que el estado es binario en cada nivel; el porcentaje es el
diagnóstico que se le muestra al cliente. Una categoría al 99% se ve como 99%, se le dice que falla y qué le falta, y se logra cuando llega a 100%.

**Qué cierra.** P16 y P18.
**Fuente:** responsable de producto, 2026-10-09; `modelo-datos.md` §9.

---

## D63 · El auditor es un rol aparte (2026-10-09)

**Decisión.**

- `auditor` es un rol con permisos propios y su propia experiencia al entrar; la vista técnica es suya (y del consultor, D64), no un modo que active el cliente.
- Lo crea **solo `admin_empresa`**. Su cuenta pertenece a la empresa (`users.company_id`); la persona suele ser externa, pero dentro de Monkey es parte de la empresa.
- Ve **todo el cumplimiento de todos los servicios** de su empresa, en solo lectura, con la **vista técnica**. `admin_empresa` y `funcional` solo ven la vista de negocio.
- Escribe **observaciones** (observación, recomendación, solicitud de información). Estados: `open` → `answered` (la empresa responde y deja constancia) → `closed` (solo quien
  la escribió). Si no queda conforme, vuelve a `open`; una cerrada no se reabre. Mientras no esté cerrada, su autor puede modificarla. No mueven el porcentaje, salvo por el
  camino normal del test documental (R-03).
- Descarga evidencias y exporta reportes en PDF y Excel. MFA obligatoria (D66). Entra al MVP.

**Qué implica para el modelo.** El auditor no tiene tabla de asignación ni excepción de aislamiento: es un usuario más de su empresa, y se le quita el acceso desactivándolo (`CC6.3`).
El hallazgo (`findings`) lo detecta solo el sistema; lo que escribe una persona es `audit_observations` (§7.6).

**Discrepancia con el TSC integral, resuelta a favor del responsable de producto:** su hoja de roles deja a `admin_monkey` crear cualquier usuario y al auditor «según
asignación»; aquí solo `admin_empresa` crea auditores y el auditor ve todos los servicios de su empresa.

**Fuente:** responsable de producto, 2026-10-09; hoja «Modelo de Gestión usuarios» del TSC integral.

---

## D64 · Hay cinco roles: el consultor prepara, el auditor certifica (2026-10-09)

**Decisión.** Se añade el rol `consultor` y se descartan los roles personalizados: los 5 roles son fijos.

- **Consultoría** prepara al cliente para la auditoría; **auditoría** es el examen final que da la certificación del marco. Hacen prácticamente lo mismo; el consultor prepara el terreno.
- El consultor es de **Next** (la empresa dueña de Monkey). Es **una sola cuenta con un solo correo**, que **crea `admin_monkey` desde Monkey Admin** y asigna a las empresas que atiende
  (`consultant_assignments`). La asignación dura hasta que se quita.
- Al iniciar sesión **elige la empresa en la que trabaja** y ve una a la vez; el sistema comprueba su asignación en cada petición. Cambiar de empresa queda en la auditoría.
- **La empresa puede suspender** a un consultor asignado (`CC6.3`) y ve la lista de los que tiene, en solo lectura. **Una suspensión de la empresa solo la reactiva la empresa**: `admin_monkey` no puede, porque anularía el control de la empresa sobre sus propios datos.
- Ve todo el cumplimiento de la empresa con la **vista técnica**, registra observaciones (las cierra quien las escribió) y exporta reportes como el auditor.
- **Da el veredicto** de los tests documentales y manuales (R-03; la IA solo sugiere), **propone las exclusiones** (las aprueba el cliente, A3) y **aprueba los cambios de controles** (D65).
- MFA obligatoria (D66).
- **El auditor es distinto:** lo crea `admin_empresa` y pertenece a una sola empresa (D63).
- **Sin roles personalizados** (`custom_roles` y `users.custom_role_id` salen del modelo). Si sobra tiempo más adelante, se vuelve a plantear.

**Por qué.** Las reglas del comité decían «el consultor evalúa» y «el consultor propone», pero ese rol no existía entre los 4 y A3 lo equiparaba con `admin_monkey`. Un consultor de Next atiende a varios clientes:
una cuenta única evita un correo por empresa (el correo es único en todo el sistema, D29) y permite que Monkey gestione quién atiende a quién.
**Qué cierra.** Quién da el veredicto de los tests manuales, quién propone exclusiones y P19 y P20. **Fuente:** responsable de producto, 2026-10-09.

---

## D65 · Controles propios y cambios de controles con aprobación del consultor (cierra P8) (2026-10-09)

**Decisión.**

- El cliente puede **proponer** crear un control propio, darlo de baja y editar las dimensiones o la interpretación de cualquier control suyo. **Decide el consultor.**
- Un control propio es **solo documental** (dimensión `policy`, tipo `manual`) y el cliente lo **ubica en una categoría** (`client_controls.trust_criterion`).
- **Cuenta para el porcentaje** de su categoría y del marco, incluso mientras está pendiente de aprobación; si se rechaza, se da de baja y deja de contar. Las bajas y las ediciones
  no se aplican hasta que se aprueban.
- No tiene punto de enfoque, así que **no cierra ningún requisito**: solo aporta al porcentaje.

**Por qué.** El cliente conoce su operación y puede tener controles que el catálogo no trae, pero cambiar lo que se mide cambia el porcentaje, así que lo valida quien prepara la auditoría.
**Fuente:** responsable de producto, 2026-10-09; `modelo-datos.md` §7.1.

---

## D66 · MFA obligatoria para los 5 roles (2026-10-09)

**Decisión.** La autenticación de dos factores (TOTP) es obligatoria para `admin_monkey`, `admin_empresa`, `funcional`, `consultor` y `auditor`, y el resto de políticas del TSC integral
(§5.3) aplican a todos. Es un requisito de seguridad sin excepciones; se construye en el sprint de acceso y usuarios, no en el de Cumplimiento.
**Por qué.** La hoja de roles del TSC la exigía solo a admin y auditor y dejaba al `funcional` sin ella; el responsable de producto la extendió a todos.
**Fuente:** responsable de producto, 2026-10-09.
