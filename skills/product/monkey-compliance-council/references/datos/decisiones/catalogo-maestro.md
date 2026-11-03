# Decisiones — Catálogo maestro

Por qué Catálogo maestro es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/catalogo-maestro/`](../../arquitectura/catalogo-maestro/README.md) y en `datos/modelo/`. Índice de todas las decisiones: [`README.md`](README.md).

## D26 · Tipos enum en `snake_case`

**Decisión:** los 41 tipos enum de Postgres se renombran de `"UserRole"` a `user_role`
(`@@map` en Prisma + `ALTER TYPE … RENAME`). Sin comillas dobles en SQL a mano. El cliente
generado no cambia. Cierra lo que estaba abierto en la bitácora de la reconstrucción (§9).

**Por qué:** la convención de identificadores del modelo es `snake_case` sin excepción, y las tablas
estaban vacías: es el momento más barato, antes de que haya seeds y funciones escritas a mano.

---

## D28 · Riesgos y causas: plantilla en el catálogo, copia por cliente

**Decisión:** el catálogo (`risks`, `causes`) es solo plantilla. Al contratar un marco se copian a
`client_risks` y `client_causes` del servicio, junto con sus relaciones (`client_risk_causes`,
`client_cause_controls`). `mitigations`, `residual_risks` y `risk_treatments` apuntan a la copia
del cliente. `service_risks` desaparece (`client_risks` ya lleva el servicio).

**Por qué:** §3.5 y §7.2 dicen que el cliente crea, edita y elimina sus riesgos y causas, pero las
tablas apuntaban directo al catálogo global: editar habría cambiado el riesgo de todos los
clientes. Lo que un cliente cambia solo lo ve él.

---

## D32 · Las `N:M` de dominios de monitoreo, explícitas

**Decisión:** `monitoring_domains ↔ requirements` y `monitoring_domains ↔ automated_capabilities`
son tablas puente propias (`monitoring_domain_requirements`, `monitoring_domain_capabilities`).
`automated_capabilities` pierde su `monitoring_domain_id`.

**Por qué:** el modelo dibuja las dos como `N:M`; la migración había hecho la segunda `1:N` y la
primera con una tabla implícita de Prisma (`_MonitoringDomainToRequirement`, columnas `A`/`B`, sin
`id`) que rompe la convención de tablas puente.

---

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
   manual valida el `admin_empresa`; la IA no certifica).
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

> **Ajustada por D68 (2026-10-10).** Qué dimensiones exige un control las define el comité en `Controles Monkey` (columnas L a P), no se derivan de las pruebas; una exigida que se quede sin test vigente deja el control `INCOMPLETO`. Las cifras de esta decisión (210) no coinciden con esa hoja (`DT-69`).

**Fuente:** decisión de Héctor, 2026-10-01. Implementación: migración `catalog_policies_as_templates`;
`Backend/prisma/seed/` (`deriveControlDimensions`, `testKind`, `parsePolicyLine`).

---

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

---

## D82 · Cada prueba lleva, junto a su nombre neutro, una descripción corta que ve el cliente (2026-10-16)

**Decisión.** `tests` gana `display_description`: la descripción corta que el cliente ve bajo el nombre de la prueba, en la vista técnica de un control. Extiende D70 con la misma regla que el nombre: es el **objetivo del comité** (hoja «Pruebas», columna OBJETIVO DEL TEST) tal cual, y solo se reescribe cuando ese objetivo nombra al proveedor de la sonda. Hoy son las mismas 4 pruebas (`T-SRV-001`, `002`, `003` y `005`); las otras 57 copian el objetivo. Es nullable y se carga como dato (`catalog:load`), no en la migración.

**Por qué.** El nombre solo no le dice al administrador de la empresa de qué va cada prueba ni qué se le pide. El objetivo del comité ya lo explica en una o dos frases; no hace falta inventar texto nuevo.

**Lo que no cambia.** El resto de textos del comité (herramienta, limitaciones, paso a paso, criterio…) siguen sin salir (D70). La descripción no es el «por qué importa» (no hay ese dato en el material del comité; queda para después) ni la remediación.

**Qué cambia.** Columna `tests.display_description` (migración `20261016120000_test_display_description`), el seed (`display-names.ts`, validador `[confidencialidad]`, `catalog:load` y `catalog:verify`), el campo `display_description` en `technical.tests` de `contracts/cumplimiento/controles.md`, y `03-catalogo-maestro.md`. **Pendiente de operar:** aplicar la migración y correr `catalog:load` en cada entorno.

**Fuente:** Carlos Castaño, 2026-10-16.

---
