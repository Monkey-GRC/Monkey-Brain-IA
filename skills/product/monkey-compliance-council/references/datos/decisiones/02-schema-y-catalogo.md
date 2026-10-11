# Registro de decisiones — D26–D42

> Parte de [`modelo-datos-decisiones.md`](../modelo-datos-decisiones.md) (índice). Revisión de migraciones, enums, RLS, siembra y clonado del catálogo, audit trail, despliegue de migraciones.
> Los identificadores (`D-n`, `A1`…) no cambian: se citan por su ID, no por la posición.

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
