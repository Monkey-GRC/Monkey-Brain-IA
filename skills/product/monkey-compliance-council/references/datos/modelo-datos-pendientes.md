# Modelo de datos — lo que falta decidir

Las decisiones **del modelo relacional** están todas cerradas, con su fuente y su
razonamiento, en **`modelo-datos-decisiones.md`**. Lo que queda abierto es lo de abajo:
preguntas de producto que **solo el comité o Nelson pueden responder**. Antes de construir
algo que dependa de una, consúltala — si sigue aquí, no la resuelvas por tu cuenta.

**Los números son estables: una pregunta cerrada no se reutiliza ni renumera el resto**, para
que las referencias desde `contracts/`, Jira o un comentario viejo sigan valiendo.

## Tablero

Lo que sigue abierto, con lo más urgente arriba. 🚧 bloquea trabajo · ⚠️ condiciona una decisión o pantalla · sin icono, no bloquea. Cada P lleva a su detalle más abajo.

| P | Pregunta | ¿Qué espera por ella? | Abierta desde |
|---|---|---|---|
| [P3](#p3--qué-ve-y-qué-hace-cada-rol-en-cada-pantalla-de-cumplimiento) | Qué ve y qué hace cada rol en cada pantalla de Cumplimiento | 🚧 Las pantallas y endpoints de Cumplimiento por rol (espera el Excel del comité) | — |
| [P14](#p14--motores-de-evaluación-rol-de-cada-uno-y-cómo-se-relacionan-con-el-modelo) | Motores de evaluación: rol de cada uno y su relación con el modelo | 🚧 El adaptador de nube y el cálculo de cobertura en nube; no Cumplimiento | 2026-10-07 |
| [P2](#p2--el-flujo-de-la-clave-de-acceso--5-detalles-sin-definir) | El flujo de la clave de acceso: 5 detalles sin definir (urgentes: a y c) | ⚠️ Condiciona la pantalla de canje (hoy hecha como código a mano, D51) | — |
| [P9](#p9--datos-del-excel-que-hay-que-corregir-o-confirmar) | Datos del Excel que hay que corregir o confirmar | ⚠️ La dimensión Aplicación del cálculo y las causas que ve el cliente | — |
| [P21](#p21--el-uso-de-los-logos-de-marcas-de-terceros) | El uso de los logos de marcas de terceros en el marketplace | ⚠️ Publicar el marketplace con logos a clientes reales; no bloquea construirlo | 2026-10-10 |
| [P22](#p22--motor-de-evaluación-lo-que-falta-para-calcular-el-riesgo) | Motor de evaluación: lo que falta para calcular el riesgo | 🚧 El riesgo residual y las dos matrices (MD-151, fuera del sprint); ⚠️ la periodicidad de los controles | 2026-10-10 |
| [P26](#p26--quién-define-el-período-auditado-y-la-fecha-de-corte-de-una-evaluación) | Quién define el período auditado y la fecha de corte de una evaluación | 🚧 Respondida **provisionalmente** (D87, 2026-10-20): falta que el comité la ratifique (Tipo I, período siguiente, nombre) | 2026-10-14 |
| [P27](#p27--cómo-se-agrupan-los-controles-en-un-marco-sin-categorías) | Cómo se agrupan los controles en un marco sin categorías | 🚧 La agrupación de la lista de controles y del resumen para marcos distintos de SOC 2 | 2026-10-15 |
| [P33](#p33--advertencias-y-confirmación-al-editar-o-dar-de-baja-un-control-un-riesgo-o-una-causa) | Advertencias y confirmación al editar o dar de baja un control, un riesgo o una causa | ⚠️ Las pantallas de edición del administrador (D96); la API no espera | 2026-10-27 |
| [P34](#p34--quien-sube-la-evidencia-y-quien-la-valida-son-la-misma-persona) | Quien sube la evidencia y quien la valida son la misma persona | No bloquea: LATER | 2026-10-27 |
| [P35](#p35--la-calificación-del-auditor) | La calificación del auditor | No bloquea: LATER, según el Excel | 2026-10-27 |
| [P36](#p36--la-independencia-del-auditor-qué-ve-de-la-evidencia-y-cómo-se-crea-su-cuenta) | La independencia del auditor: qué ve de la evidencia y cómo se crea su cuenta | No bloquea: LATER (MD-183) | 2026-10-28 |
| [P37](#p37--criterios-de-las-observaciones-del-auditor-que-desarrollo-fijó-sin-que-el-comité-los-pidiera) | Criterios de las observaciones del auditor que desarrollo fijó sin que el comité los pidiera | No bloquea: está construido (MD-154) y funciona; se ajusta si el PO decide otra cosa | 2026-10-29 |
| [P13](#p13--ratificar-lo-que-desarrollo-decidió-en-las-correcciones-del-2026-10-05-d50-d51) | Ratificar lo que desarrollo decidió el 2026-10-05 (D50, D51) | No bloquea: está construido y funcionando | 2026-10-06 |
| [P15](#p15--cómo-se-mapean-los-checks-de-nube-que-quedan-fuera) | Cómo se mapean los checks de nube que quedan fuera | No bloquea: lo no mapeado no cuenta hasta responder | 2026-10-08 |

---

## P2 · El flujo de la clave de acceso — 5 detalles sin definir

La decisión de fondo está cerrada (D24: Monkey Admin registra el tenant, la clave se manda
al `admin_email`). Falta el detalle operativo, y **condiciona la pantalla del día 1-2 del
sprint de onboarding**:

| # | Pregunta |
|---|---|
| a | ¿La clave es un código que el cliente escribe a mano, o un link con token en la URL? Cambia qué pantalla hay que construir. *Hoy se implementó como código escrito a mano, en dos pasos (D51); no es una respuesta explícita del comité a esta pregunta* |
| b | ¿Cuánto dura antes de expirar, y puede `admin_monkey` regenerarla o reenviarla si el correo se perdió? |
| c | Si `admin_monkey` se equivoca escribiendo el nombre de la empresa o el correo, ¿se puede corregir desde Monkey Admin antes de que el cliente entre? Importa porque ese nombre queda **bloqueado** en el Componente 1 |
| d | Si se marca "base de datos dedicada", ¿aprovisionarla es instantáneo o toma tiempo? Si toma tiempo, ¿se manda la clave de una vez o se espera? |
| e | ¿Puede haber más de un correo administrativo por empresa desde el registro, o el resto de usuarios se invita después desde adentro? |

Las más urgentes son **(a)** y **(c)**.

## P3 · Qué ve y qué hace cada rol en cada pantalla de Cumplimiento

**Estado:** abierto. El comité entrega un Excel con los permisos **por pantalla**; hasta que llegue, la matriz de `modelo-datos.md` §5.5 es la vigente y los tickets que dependen de ella esperan.

Lo que ya está decidido: los 4 roles son fijos y no hay roles personalizados (D96); Cumplimiento vive **dentro de cada servicio**; el `funcional` ve solo sus controles y las evidencias que debe aportar.
Lo que falta: el detalle por pantalla de cada rol.

**Qué depende:** las pantallas y los endpoints de Cumplimiento por rol.

## P9 · Datos del Excel que hay que corregir o confirmar

Inconsistencias **dentro del propio archivo del comité**, que el seed carga tal cual sin adivinar (D38):

- **Pruebas de aplicación.** La matriz *Análisis TEST x Control* asigna a 17+5+1+2+1+1 = 27 pares control↔prueba
  seis pruebas `T-APP-001…006` que no existen en la hoja *Pruebas* (la hoja marca *"FALTAN 6"*), y la hoja
  *Pruebas* tiene seis sin usar en la matriz: `T-SRV-011…014`, `T-BD-009` y `T-BD-010`. Sus controles coinciden
  en 94-100%, así que probablemente son las mismas pruebas con otro código y otra dimensión. **Hoy la
  dimensión Aplicación no tiene ninguna prueba.** ¿Son pruebas de aplicación (se recodifican a `T-APP` y
  `app`) o de servidores/BD (se corrige la matriz)?
- **Diez causas sin riesgo.** F003, F004, F016, F020, F026, F034, F042, F045, F053 y F054 no aparecen en ninguna
  de las 92 relaciones riesgo↔causa. ¿A qué riesgo(s) pertenecen o se descartan?

- **Tipos de pérdida de un riesgo.** La hoja *Riesgos* usa «Interrupción de la operación» en dos riesgos e «Interrupción o cierre de la operación» en otros dos. ¿Son el mismo tipo de pérdida? El contrato los trata como uno solo (`operation_interruption`): **decisión de desarrollo del 2026-10-17**; el comité lo ratifica al revisar el Excel.

**Qué depende:** la dimensión Aplicación del cálculo (§2, §9) qué causas ve el cliente al clonar (§7.2) y los valores de `loss_type`.

## P13 · Ratificar lo que desarrollo decidió en las correcciones del 2026-10-05 (D50, D51)

**Estado:** abierto desde 2026-10-06. No bloquea nada: todo está construido y funcionando; falta que el comité lo confirme.

1. **Lista de 7 marcos ofrecidos** (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF, SOC 1) y su orden. La armó desarrollo con datos de demanda de proveedores de cumplimiento (Drata, ACC 2025), no el comité. ¿Es la lista correcta para la oferta comercial?
2. **Lista de 18 normas de protección de datos** (DT-40): ¿se ratifica que salga PCI DSS, que HIPAA y GLBA se queden, y las 5 que entraron (Ley 21.719 CL, UY, EC, PA, CR)? ¿Faltan otras (p. ej. Ley 1266 de Colombia)?
3. **Categorías por marco** (D50, DT-38): confirmada la opción de que cada marco use las suyas. Falta que el comité entregue **cuáles son** las de cada marco (ISO 27001: ¿4 temas del Anexo A? PCI DSS: ¿12 requisitos? NIST CSF: ¿6 funciones?) y si «seguridad siempre obligatoria» se generaliza a un dominio obligatorio por marco.
4. **Contacto de ventas** (DT-41): ¿qué canal real recibe el interés cuando un cliente toca un marco que no contrató?
5. **Certificación previa:** ¿las 8 opciones son las correctas para una «certificación o evaluación» previa?

## P14 · Motores de evaluación: rol de cada uno y cómo se relacionan con el modelo

**Estado:** abierto desde 2026-10-07. Nace de una prueba real: un escaneo de configuración de una cuenta de AWS
(292 hallazgos, 70 checks, 8 servicios, 17 regiones) hecho con una herramienta distinta de la sonda. Choca con la
decisión de «validador único» (D13, `wazuh.md`): **no se cierra D13 hasta que el comité responda A1**. Bloquea el
adaptador de nube y el cálculo de cobertura en nube; no bloquea el módulo de Cumplimiento.

**Propuesta de desarrollo (no decidida):** el catálogo, los checks y su mapeo a controles son de Monkey; los motores
son adaptadores intercambiables que solo entregan resultados crudos en un formato único (`check_results`). La sonda
cubriría servidores, BD y endpoints; un motor de configuración, la nube.

**A. Rol de los motores**
1. ¿Se acepta que un motor distinto cubra la nube y se cierra D13? ¿La sonda queda solo con servidores, BD y endpoints?
2. ¿Cómo se llama ese motor frente al cliente? La regla de confidencialidad aplica igual.
3. ¿Hay un tercer motor previsto (Azure, GCP, SaaS)?

**B. Unidad de evaluación** *(B1 y B3 respondidas en D53: el activo es la cuenta y se evalúan solo las regiones declaradas)*
2. Una instancia en la nube es también un servidor (`ac_02`). ¿Se enlaza el recurso hallado con el activo del servidor, o son cosas separadas?
4. Un check que falla en 3 de 5 discos, ¿es 1 evaluación fallida o 3?

**C. Conexión y credenciales**
1. ¿Rol entre cuentas sin llaves guardadas en producción (propuesta), en vez de usuario con llaves estáticas?
2. Permisos mínimos que se piden al cliente y quién los crea.
3. ¿Dónde corre el motor? Hoy en el mismo servidor que la sonda y con llaves del cliente guardadas allí.
4. Frecuencia, duración y coste en llamadas a la API (`ac_01` fija 6-24 h).
5. ¿Azure y GCP producen el mismo formato de salida y alguien los probó?

**D. Catálogo y mapeo**
1. ¿Se cargan al catálogo los 70 checks, o solo los que el comité elija, y con qué `origin`?
2. El motor trae su propio mapeo a SOC 2. Si no coincide con el del comité, gana el del comité (regla del brain); ¿se guarda el otro como mapeo con procedencia?
3. Los `T-CLD-*` nombran a la sonda como herramienta (ver D70). ¿Se reescriben?
4. Estados del motor que no existen en el modelo: `MANUAL` ya se trata como `not_run` (confirmado). Falta el **silenciado**: propuesta, un silencio con justificación aprobada.

**E. Producto y legal**
1. Licencia y forma de uso del motor (redistribuir o ofrecer como servicio). No verificado.
2. Quién revisa el texto de IA antes de que llegue al cliente y quién responde por un falso positivo.

**Qué depende:** columnas nuevas de `check_results` (recurso, región, detalle), carga de checks, `Evaluation` en nube y el paso 3 del onboarding para nube (DT-35).

## P15 · Cómo se mapean los checks de nube que quedan fuera

**Estado:** abierto desde 2026-10-08 (D56). No bloquea nada: lo que no tiene la cadena completa **no cuenta** hasta que el comité responda.

Del catálogo de 662 checks de AWS, lo que no llega a un control:

1. **104 checks sin prueba**: no encajan en ninguna `T-CLD`. ¿A qué prueba van, o se descartan? (Lista: los que no aparecen en `test_checks` tras `npm run cloud:load`.)
2. **Las pruebas `T-CLD-004` a `007` no tienen ningún check.** ¿Se cubren con checks que aún no se han buscado o quedan manuales por activo?
3. **Seis requisitos que el motor cita** no los alcanza ninguna prueba de nube: CC1.3, CC3.1, CC3.2, CC5.2, CC7.3 y CC7.5. ¿Se añade el vínculo o quedan como cobertura no alcanzada?
4. **Ratificar las 569 asignaciones propuestas** (`monkey_proposed`): se pide por prueba (11 `T-CLD`), no check por check.

**Qué depende:** que esos checks cuenten para el cumplimiento (§9) y la cobertura técnica real de la nube.

## P21 · El uso de los logos de marcas de terceros

**Estado:** abierto desde 2026-10-10 (D67). No bloquea construir el marketplace: condiciona publicarlo con logos a clientes reales.

El paso 3 muestra el logo en SVG de cada plataforma (AWS, Azure, GCP, Microsoft 365, Google Workspace, Linux, Windows, PostgreSQL, Oracle…). Las marcas son de terceros y varias
tienen guías de uso: logo oficial sin modificar, espacio libre mínimo, a veces una leyenda.

1. ¿Se tiene permiso o se revisó la guía de marca de cada proveedor para mostrar su logo en la plataforma?
2. ¿Quién entrega los SVG oficiales y dónde se guardan?
3. ¿Basta con un aviso en la plataforma («las marcas pertenecen a sus titulares») o se necesita algo más?

**Procedencia hoy** (`DT-68`): colecciones de iconos de marca, no los kits de cada proveedor. Simple Icons: Linux, HP (para HP-UX), PostgreSQL, MySQL, Oracle y MongoDB · Devicon: AWS, Azure, GCP, SQL Server y un icono genérico de Unix (para Solaris) · Logos: Microsoft (para Microsoft 365), la «G» de Google (para Google Workspace), Windows, AIX y Apple (para macOS). Cinco son una sustitución por la marca dueña del producto, no el logo propio de ese producto.

**Qué depende:** los logos de `Frontend-Platform` (`logo_key`, D67) y la publicación del marketplace.

## P22 · Motor de evaluación: lo que falta para calcular el riesgo

**Estado:** abierto desde 2026-10-10; revisado a fondo contra el Excel el 2026-10-13 (D76). De las diez «decisiones pendientes» del prototipo, **siete están cerradas** (D74, D75, D76) y lo que sigue abierto son **tres datos y una entrega**.
Solo afectan al **motor de riesgos** (MD-151, fuera del sprint); el cálculo del cumplimiento (§9) no depende de ellas.

**Vocabulario del comité** (D76): *riesgo* es la probabilidad y el impacto de que algo ocurra o se pierda si alguien lo materializa · *causa* es aquello por lo que el riesgo se materializa · *control* es el paso a paso que lo evita o lo mitiga ·
la **matriz inherente** muestra cada riesgo antes de aplicar controles y la **matriz residual**, después. **Las matrices son la lectura de la evolución, no el criterio de mitigación**: eso lo dicen los controles y sus tests.

**1. De cada relación causa–control, ¿el control es obligatorio y reduce la probabilidad o el impacto?** *(decisión 9; es lo único que bloquea el riesgo residual)*
*Lo que ya está:* la hoja `Causas`, columna «Controles_Aplicables», tiene **las 56 causas con sus controles: 209 relaciones**. Eso está completo.
*Lo que falta:* para cada una de esas 209, dos datos que la fórmula necesita: si el control es **obligatorio** para esa causa, y si al funcionar hace el riesgo **menos probable** o **menos grave**. Hoy solo lo tienen las **9** del ejemplo del prototipo (bloque G).
*Por qué importa:* sin el efecto, la fórmula del residual (D75) no puede aplicarse a casi ningún riesgo.

**2. ¿Cada cuánto se reevalúa cada control, y puede bajarse la frecuencia de lo automático?** *(decisión 5)*
*Lo que ya está:* la regla, que el comité confirmó: **manda la periodicidad del control** (si se revisa cada 3 meses, sus checks se evalúan cada 3 meses); las comprobaciones automáticas corren con la frecuencia de su conexión (`AC-01` cada 6-24 h, el resto continuas). El período de prueba de cada test está en `Pruebas` columna I.
*Lo que falta:* la periodicidad **no es un campo del catálogo**: está en prosa, en la descripción de **18 de los 119 controles**. Hace falta como **columna por control** para poder programarla. Y una respuesta a la objeción de desarrollo: **reevaluar a diario todo lo automático genera una carga alta** de peticiones sobre la infraestructura del cliente y sobre la sonda; ¿se puede bajar esa frecuencia por control o por conexión?

**3. ¿Quién fija y aprueba el apetito de riesgo?** *(decisión 2)*
*Lo que ya está:* el valor inicial, **9 sobre 25**, que propone el comité y ya usamos (D75); y para qué sirve: leer la matriz residual, no declarar un riesgo mitigado (D76).
*Lo que falta:* quién lo fija y quién lo aprueba — ¿Monkey para todos, cada empresa o cada servicio? — y si cambia según el tipo de riesgo.

**Lo que el comité va a entregar** *(no son preguntas; se espera el archivo)*
- **Un Excel con el detalle completo de la fórmula de cumplimiento**, entre el **14 y el 15 de octubre de 2026**. Hasta recibirlo no se construye el motor de riesgos; si contradice algo de §9, manda ese archivo.
- **Los criterios** que guíen al cliente al poner la probabilidad y el impacto de cada riesgo (decisión 8). Quién los pone ya está decidido: **el cliente** (D33, D76), y las escalas de 1 a 5 ya están descritas en la hoja `Riesgos`.

**Qué depende:** el riesgo residual y las dos matrices (MD-151) esperan el dato 1 y el Excel que viene. La periodicidad (2) condiciona cuándo se marca algo vencido y la carga sobre la sonda.

## P26 · Quién define el período auditado y la fecha de corte de una evaluación

**Estado:** abierto desde 2026-10-14 (MD-108). El motor no ejecuta sin los cinco datos de la evaluación: servicio, marco, versión, **período auditado** y **fecha de corte** (REQ-004, §9). `service_frameworks` tiene `period_start`, `period_end` y `cutoff_date` (columnas desde MD-144), pero ningún formulario ni endpoint las llena: el onboarding solo pide un `evaluation_period` de texto.

1. **¿Quién declara el período auditado y cuándo?** *Recomendación: `admin_empresa`, al contratar el marco o crear el servicio; editable mientras no se haya congelado.*
2. **¿La fecha de corte es «hoy» mientras se monitorea y se congela al emitir una evaluación del servicio (hoy en pausa, D96)?** *Recomendación: sí; así cada evaluación dice sobre qué datos se hizo.*

**Respuesta provisional (D87, 2026-10-20):** se adoptaron las dos recomendaciones para poder construirlo (el criterio de desarrollo no sustituye al comité): `admin_empresa` declara el período; la fecha de corte es «hoy» mientras se monitorea y se congela al emitir una evaluación. Inicio y fin pueden coincidir (Tipo I). **Sigue abierto para el comité:** si se vende Tipo I, qué pasa al llegar el período siguiente (hoy una sola fila por servicio y marco) y el nombre (el Excel dice «fecha de evaluación»).

**Qué depende:** el resumen del servicio (MD-137), las evaluaciones del servicio (en pausa, D96) y la vigencia de las exclusiones (MD-144). Sin período la API responde `not_measured` y `409 EVALUATION_NOT_DEFINED`, también al proponer una exclusión (MD-144). **MD-168 está construido (2026-10-20, D87)**: `PUT …/evaluation-period`.

---

## P27 · Cómo se agrupan los controles en un marco sin categorías

**Estado:** abierto desde 2026-10-15 (D80). La lista de controles y el resumen se agrupan por **categoría**, y en SOC 2 la categoría es el criterio de confianza (Seguridad, Disponibilidad, Integridad del procesamiento, Confidencialidad, Privacidad). **Otros marcos no tienen ese nivel** (ISO 27001, NIST CSF y PCI DSS agrupan distinto), y el modelo hoy solo tiene 	rust_criteria, que es de SOC 2. En cambio **cada control ya trae un domain** (27 valores literales del comité: «Gestión de Activos», «Monitoreo Continuo»…), que es **del control y no del marco** (D35), así que existe sea cual sea el marco.

1. **¿Cuál es la agrupación principal?** *Recomendación: la categoría del marco cuando el marco la define (SOC 2); si no, el domain del control. El domain queda además siempre disponible como filtro.*
2. **¿Se muestra el código de la categoría o su nombre?** *Recomendación: el nombre del marco para la categoría (el que figura en el marco) y, al lado, el código de cada control y de cada requisito (CC6.1, IAC-12), que sí existen en todos los marcos.*
3. **¿Cómo se llama la agrupación en la pantalla?** *Recomendación: «Categoría» en SOC 2 y el nombre propio del marco en los demás (la API lo manda como etiqueta, no se escribe en el frontend).*

**Qué depende:** la lista de controles (MD-120) y el resumen (MD-140) para cualquier marco que no sea SOC 2. Para el MVP (solo SOC 2) no bloquea nada. Si se adopta la recomendación, el contrato de controles añade domain a cada ítem.

---

## P33 · Advertencias y confirmación al editar o dar de baja un control, un riesgo o una causa

**Estado:** abierto desde 2026-10-27 (D96). El `admin_empresa` los cambia directamente, con advertencia y confirmación. Falta definir **qué** advierte la pantalla y **cuándo**: darlo de baja cambia lo que se mide y, por tanto, el avance del servicio.

1. **¿Qué se le muestra antes de confirmar?** *Recomendación: lo que cambia de verdad —cuántas pruebas dejan de contar, qué riesgos y causas quedan sin ese control y cómo se mueve el avance y la cobertura del servicio—, no un «¿está seguro?» genérico.*
2. **¿Pide un motivo?** *Recomendación: sí en la baja y en quitar una dimensión; opcional en una edición de texto. Queda en la auditoría.*
3. **¿Un control con resultados ya emitidos se puede dar de baja?** *Recomendación: sí, como baja (nunca borrado); el historial y las evaluaciones inmutables se conservan.*

**Qué depende:** las pantallas de edición del administrador. No bloquea la API.

---

## P34 · Quien sube la evidencia y quien la valida son la misma persona

**Estado:** abierto desde 2026-10-27 (D96). El `admin_empresa` valida la evidencia y también puede subirla. Aunque su foco no es subirla, puede pasar, y entonces se califica a sí mismo.

*Recomendación: no bloquear por ahora; que cada validación quede en el rastro con quien subió y quien validó, y que el `auditor` externo sea el contrapeso. Si hace falta, más adelante: que no pueda validar lo que él mismo subió, o que un segundo administrador lo confirme.*

**Qué depende:** nada del código inmediato. Es `LATER`.

---

## P35 · La calificación del auditor

**Estado:** abierto desde 2026-10-27 (D96). La evaluación del auditor (certificar o no, D77) queda en pausa. Cuando vuelva, se diseña según lo que pida el Excel del comité, sin cambiar el estado calculado del servicio.

**Qué depende:** nada del código inmediato. Es `LATER`.

## P36 · La independencia del auditor: qué ve de la evidencia y cómo se crea su cuenta

**Estado:** abierto desde 2026-10-28 (MD-183, reducido por D96). El auditor es independiente en la práctica real: forma su propio juicio sobre lo que la empresa presenta como final. Hoy la empresa lo crea y puede ver todo, incluidas las versiones rechazadas de una evidencia.

1. **¿El auditor ve solo la versión vigente de cada evidencia?** *Recomendación: sí; las anteriores se piden aparte, de forma explícita, y consultarlas queda en el rastro.*
2. **¿La revisión de una evidencia pasa a ser histórico inmutable?** Hoy `PUT …/review` reemplaza la fila de la entrega (el rastro guarda el antes y el después). *Recomendación: se agrega una revisión nueva y la vigente es la última.*
3. **¿Hace falta una declaración de independencia al crear al auditor?** *Recomendación: sí, con quién la creó y cuándo.*

**Qué depende:** MD-183. No bloquea la API de observaciones (MD-154). Es `LATER`.

## P37 · Criterios de las observaciones del auditor que desarrollo fijó sin que el comité los pidiera

**Estado:** abierto desde 2026-10-29 (MD-154). El Excel y `modelo-datos.md` §7.6 definen las observaciones, pero no estos detalles; desarrollo los resolvió con el criterio más sencillo para poder construir y los dejó anotados aquí para que el PO los ratifique o los cambie. Es lo mismo que D85 hizo con las observaciones abiertas («criterio provisional de desarrollo»).

1. **¿Qué es una observación «abierta» para exigir la razón del veredicto?** Hoy: `status = open` y solo en el **control de origen** (D85). Una respondida (`answered`) ya no la exige. *Alternativa:* exigirla también mientras esté respondida y sin cerrar, o mirar los controles que comparten la prueba. *Recomendación: dejarlo como está; la empresa ya atendió la respondida.*
2. **¿Se abren observaciones sobre un control dado de baja?** Hoy: no (`409 CONTROL_RETIRED`); las que ya tenía se siguen leyendo. *Recomendación: dejarlo como está.*
3. **¿La evidencia que respalda una respuesta puede ser de cualquier control o solo del mismo servicio?** Hoy: de un control del mismo servicio. *Recomendación: dejarlo como está.*
4. **Si el auditor comenta solo una evidencia, ¿la observación queda en el control de esa evidencia?** Hoy: sí (una entrega pertenece a un único control), y así la ve el `funcional` responsable. *Recomendación: dejarlo como está.*
5. **Al devolver una observación a `open`, ¿se conserva la última respuesta?** Hoy: sí, hasta que la empresa dé otra; la anterior queda solo en el rastro de auditoría (no hay tabla de historial de respuestas). *Alternativa:* guardar cada respuesta en una tabla aparte. *Recomendación: dejarlo como está mientras nadie pida ver el historial de respuestas en pantalla.*
6. **¿La empresa debe enterarse de que tiene una observación nueva?** Hoy no hay aviso (no existe el sistema de correos y notificaciones, `MD-69`). *Recomendación: sí, por correo y en la app, cuando exista ese sistema.*

**Qué depende:** nada del código inmediato; el comportamiento actual está en `contracts/modules/compliance-audit.md` y `modelo/07-cumplimiento.md` §7.6. Si el PO cambia alguna respuesta, se ajusta el contrato y la prueba que la cubre (`test/cumplimiento/observaciones.e2e-spec.ts`, `veredictos.e2e-spec.ts`). Es `LATER`.

---
## Cómo se cierra un pendiente

1. El comité responde.
2. La decisión se escribe en `modelo-datos-decisiones.md`, con la fuente y el porqué, y si
   cambia una tabla o el cálculo, se ajusta `modelo-datos.md`.
3. Se borra de este archivo.
4. Se cierra el ticket de Jira correspondiente en el proyecto `MD`, con la decisión y su
   fuente en un comentario.

## Cerradas hasta hoy

Se quedan aquí como referencia; el detalle de cada una está en la decisión que la cerró.

| | Pregunta | Cerrada |
|---|---|---|
| **P1** | Cumplimiento fuera del onboarding | 2026-09-26 — el comité confirmó D23: el onboarding se queda en 3 componentes |
| **P4** | `responsible_id` sin catálogo de cargos | 2026-09-29 — cerrada por desarrollo en D30: el cargo es `organization_responsibles`. **Falta ratificarla con el comité**; no bloquea nada |
| **P5** | Dos cifras de la documentación de la sonda | 2026-10-08 — las cifras («869 checks, 646 nativos, 223 inferidos») no tenían universo y se quitaron de `wazuh.md`; la versión de referencia es la del manager que corre en desarrollo, 4.14.6 (D55) |
| **P6** | La lista completa de `business_model` | 2026-10-10 — D73: son las 19 del Excel más `other`; si el comité entrega más, se agregan con una migración |
| **P7** | Dónde se aloja el Postgres de producción | 2026-10-10 — D72: servidor o servicio administrado separado de la app, con respaldos a un punto en el tiempo y rotación de 35 días (D97) |
| **P8** | ¿Un control que crea el cliente cuenta para el marco? | 2026-10-09 — D65: sí cuenta para el porcentaje; es solo documental, va en la categoría que elige el cliente y lo crea directo el `admin_empresa` (D96) |
| **P10** | Origen de `control_dimensions` y qué es `policies` | 2026-10-01 — cerrada por desarrollo en D39: la dimensión aplica si el control tiene una prueba de ella; `policies` es una plantilla. **Falta ratificar con el comité el tipo y las banderas derivados**; no bloquea nada |
| **P11** | El nombre del proveedor en los textos de las pruebas | 2026-10-10 — D70: el cliente ve el resultado y un nombre neutro que escribe Monkey; los textos del comité son internos |
| **P12** | Cómo se conecta Monkey a la sonda (paso 3 del control técnico) | 2026-10-10 — D71: lectura por la API con un usuario de solo lectura por grupo; solo se promete lo que tiene prueba; la IP de desarrollo es una acción de infraestructura |
| **P16** | Cuándo un activo está «Preparado», «Casi listo» o «Requiere trabajo» | 2026-10-09 — D62: se lee con el porcentaje de tests con resultado, con los cortes de 100% y 80% *(el semáforo se conserva en D68)* |
| **P17** | ¿El paso 3 del onboarding exige al menos una conexión comprobada? | 2026-10-10 — D69: no; se completa al definir dónde vive el servicio e «Inicio» invita a conectar |
| **P18** | Una categoría sin nada medido, y la cobertura | 2026-10-09 — D62: no está lograda y cuenta en el denominador; la cobertura es siempre un número aparte *(D68: una categoría sin nada medido queda «en evaluación» y no cumple; la cobertura sigue aparte)* |
| **P19** | Una persona que atiende a varias empresas, con el correo único | 2026-10-27 — D96: obsoleta; las cuentas pertenecen a una sola empresa |
| **P20** | Quién reactiva a quien la empresa suspendió | 2026-10-27 — D96: el `admin_empresa` desactiva y reactiva a su equipo (`users-team.md`) |
| **P23** | Cómo se guarda y se muestra la evaluación del auditor | 2026-10-13 — D77: va aparte y no cambia el estado, ligada a la evaluación del servicio. En pausa por D96 (`P35`) |
| **P24** | Quién aprueba una exclusión | 2026-10-27 — D96: el `admin_empresa` la propone y la decide en un solo acto; no hay espera |
| **P25** | Si validar las evidencias de un test documental es lo mismo que dar su veredicto | 2026-10-22 — D88: una prueba documental se valida en su control con la evidencia que se sube para esa prueba; no hay un segundo paso de veredicto. Desde D96 la validación es del `admin_empresa` |
| **P28** | A quién contacta la empresa cuando una exclusión espera decisión | 2026-10-27 — D96: obsoleta; la exclusión no espera |
| **P31** | El Excel y el cerebro no coinciden en los roles | 2026-10-27 — D96: gana el Excel (cuatro roles; el `admin_empresa` valida la evidencia); la MFA sigue en los cuatro roles (D66) |
| **P29** | Cómo activa su cuenta quien la empresa invita | 2026-10-27 — D95, D96: un código de activación de un solo uso, ligado a su correo, que le entrega el `admin_empresa`; con él pone su contraseña y configura el segundo factor |
| **P30** | Dónde vive una cuenta y cómo se aísla entre empresas | 2026-10-27 — D96: cada cuenta pertenece a una sola empresa y el aislamiento es el de siempre (RLS por `tenant_id`); no hay cuentas que entren a varias empresas |
