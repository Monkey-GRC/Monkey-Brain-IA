# Registro de decisiones — A–D y D23–D25

> Parte de [`modelo-datos-decisiones.md`](../modelo-datos-decisiones.md) (índice). Estructura, cálculo, material fuente y aprovisionamiento (septiembre 2026).
> Los identificadores (`D-n`, `A1`…) no cambian: se citan por su ID, no por la posición.

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
