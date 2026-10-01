# Modelo de datos — registro de decisiones

Bitácora de las decisiones que cerraron el modelo relacional, desde el 15 de
septiembre de 2026, con la fuente y el razonamiento de cada una.

Esto no es el modelo: el modelo está en **`modelo-datos.md`**, y ahí se lee qué hay que
construir. Este archivo existe para responder *"¿por qué se decidió así?"* sin volver a
discutirlo, y para que si alguna decisión resulta equivocada se pueda revisar sabiendo en
qué se apoyaba.

Lo que sigue abierto está en **`modelo-datos-pendientes.md`** (hoy, 9 preguntas: P2, P3, P5, P6, P7, P8, P9, P10 y P11).

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

- **Propone:** el consultor (`admin_monkey`). **Aprueba:** el cliente (`admin_empresa`).
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

**D1 · El 40/60 de la matriz ya no bloquea nada: el comité especificó la fórmula completa.**
La pregunta era si ese número era proporción de automatizabilidad o cumplimiento parcial
del requisito. El ejemplo de fórmula del comité (`modelo-datos.md` §9) la vuelve irrelevante para el
cálculo: **la fórmula no pasa por el requisito**. Va evaluación → control → dimensión
temática → servicio, con las 12 reglas R-01…R-12 de §9.

- Si el comité quiere conservar la automatizabilidad de un requisito como dato, es un
  **indicador aparte** y no toca el cálculo.
- **B2 (requisito binario) queda confirmado y a la vez deja de ser crítico**: el requisito
  no participa del porcentaje. Sirve para trazabilidad y para el reporte al auditor
  (*"¿qué evidencia tengo para CC6.1?"*), no para medir.

**El agregado se hace por promedio de porcentajes, en dos saltos** (R-09, R-10), no
contando controles cumplidos. Esto **corrige** lo que este documento decía: con los
números del ejemplo, la versión vieja habría reportado 40% donde el comité reporta 92,6%.

**Pendiente no entra al denominador** (R-06, R-08): `cumplen / (cumplen + fallan)`. Es la
fórmula exacta de las reglas R-06 y R-08 del ejemplo de fórmula (`modelo-datos.md` §9).
"Evaluables" en R-08 significa exactamente `cumplen + fallan`: excluye `not_applicable` y
`pending`.

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
  arranque (`modelo-datos.md` §5.1, los 4 roles; la matriz de permisos, en §5.5).
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

**Deja abierto (P8):** un control propio no tiene punto de enfoque, así que no puede cerrar un requisito
del marco; si aun así cuenta para el % del servicio, y cómo se mapearía a un requisito, lo decide el comité.

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
| Políticas vinculadas | 16 | 16 vínculos a **10** políticas distintas (no se siembran: P10) |
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
- **`control_dimensions`, `control_measurements` y `policies` no se siembran**: sin fuente en el Excel (P10) o
  sin uso en el MVP (D2).
- **Pruebas en texto:** el paso a paso y los atributos se guardan como listas separadas por su numeración
  (`1.`/`1)`) o sus viñetas; si una prueba no trae numeración 1, 2, 3… la extracción falla en vez de adivinar.

**Fuente:** perfilado de `TSC INTERGRAL SOC 2 DETALLADO VF.xlsx` del 2026-09-30. Decisión de Héctor.

---

## D39 · La clave de acceso se canjea una sola vez, y solo con el correo administrativo

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

## D40 · Componente 1 del onboarding: huecos del contrato resueltos por desarrollo

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

## D41 · Componente 2 del onboarding: ajustes del schema y huecos resueltos por desarrollo

**Decisiones** (Carlos, 2026-09-30; **pendientes de ratificar con el comité**; ninguna toca cómo se
calcula el cumplimiento). Son los huecos que `onboarding-service-context.md` dejaba abiertos o que el
schema contradecía:

**Cambios de schema** (migración 24, `service_context_optional_fields_and_regulations`):

1. **`services.deployment_scenario` pasa a nullable.** El contrato dice que se captura en el
   Componente 3, pero la columna era `NOT NULL`: era imposible declarar el servicio antes de conectar la
   infraestructura.
2. **`subservice_organizations.provider`, `service_provided` y `responsibility` pasan a nullable.** El
   "detalle" del Excel es opcional y solo el `type` es obligatorio (el contrato ya lo decía).
3. **Nueva tabla `service_regulations`** (servicio ↔ regulación, con RLS por `tenant_id`). Cierra la
   pregunta abierta "regulación a nivel de servicio": el request del contrato ya traía
   `regulation_codes` y no tenía dónde persistir. No se puntúa (D10).

**Reglas del clonado** (lo que MD-80 / D36 dejaban sin precisar):

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

10. **Descripción del Sistema: solo enlace** (`kind = link`, `http`/`https`). El archivo
    (`multipart`, 25 MB) no se construyó: no hay dónde guardar binarios todavía. `kind = file` responde 422.
11. **Nombre único por empresa** sin importar mayúsculas ni espacios (`SERVICE_NAME_TAKEN`); la base no lo
    impone, la aplicación sí.
12. **`DELETE` con historia:** además de evaluaciones, bloquean la eliminación las **evidencias entregadas
    y los planes de acción** (todo trabajo del cliente). `409 SERVICE_HAS_EVALUATIONS`.
13. **`FRAMEWORK_NOT_CONTRACTED` no se usa:** no existe una contratación de marcos a nivel de empresa en el
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
