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
| [P23](#p23--cómo-se-guarda-y-se-muestra-la-evaluación-del-consultor-y-la-del-auditor) | Cómo se guarda y se muestra la evaluación del consultor y la del auditor | ⚠️ Las pantallas de veredicto del consultor (MD-155) y la evaluación del auditor | 2026-10-10 |
| [P22](#p22--motor-de-evaluación-las-diez-decisiones-que-el-excel-deja-abiertas) | Motor de evaluación: las diez decisiones que el Excel deja abiertas | ⚠️ Los parámetros del motor (errores, vigencia); 🚧 el riesgo residual (MD-151, fuera del sprint) | 2026-10-10 |
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

Lo que ya está decidido: los 5 roles son fijos y no hay roles personalizados (D64); Cumplimiento vive **dentro de cada servicio**; el `funcional` ve solo sus controles y las evidencias que debe aportar.
Lo que falta: el detalle por pantalla de cada rol.

**Qué depende:** las pantallas y los endpoints de Cumplimiento por rol.

## P9 · Datos del Excel que hay que corregir o confirmar

Dos inconsistencias **dentro del propio archivo del comité**, que el seed carga tal cual sin adivinar (D38):

- **Pruebas de aplicación.** La matriz *Análisis TEST x Control* asigna a 17+5+1+2+1+1 = 27 pares control↔prueba
  seis pruebas `T-APP-001…006` que no existen en la hoja *Pruebas* (la hoja marca *"FALTAN 6"*), y la hoja
  *Pruebas* tiene seis sin usar en la matriz: `T-SRV-011…014`, `T-BD-009` y `T-BD-010`. Sus controles coinciden
  en 94-100%, así que probablemente son las mismas pruebas con otro código y otra dimensión. **Hoy la
  dimensión Aplicación no tiene ninguna prueba.** ¿Son pruebas de aplicación (se recodifican a `T-APP` y
  `app`) o de servidores/BD (se corrige la matriz)?
- **Diez causas sin riesgo.** F003, F004, F016, F020, F026, F034, F042, F045, F053 y F054 no aparecen en ninguna
  de las 92 relaciones riesgo↔causa. ¿A qué riesgo(s) pertenecen o se descartan?

**Qué depende:** la dimensión Aplicación del cálculo (§2, §9) y qué causas ve el cliente al clonar (§7.2).

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

## P22 · Motor de evaluación: las diez decisiones que el Excel deja abiertas

**Estado:** abierto desde 2026-10-10 (D68). La hoja `MODELO EVALUACIÓN MONKEY` de la VF2 las lista en su último bloque como «**decisiones pendientes para el equipo Monkey (antes de programar)**»: no son una
pregunta al comité, las resuelve el equipo (y lleva al comité lo que necesite su criterio funcional). Esa hoja la generó una IA a pedido de quien manejaba el libro (su bitácora, `Claude Log`), así que son lo que quedó sin
resolver, no puntos que el comité haya querido discutir a propósito. **Mientras no se respondan, el motor las deja como parámetros y no fija ningún valor** (REQ-039: nada de umbrales ni apetito escritos en el código).

1. **Metodología del riesgo residual.** Propuesta del comité (sin aprobar): cada control efectivo baja la probabilidad o el impacto, con un tope (máximo 2 puntos en probabilidad y 1 en impacto). ¿Se aprueba, y el diseño o solidez del control pondera la reducción?
2. **Apetito de riesgo.** El ejemplo usa 9 sobre 25. ¿Es por servicio, por criterio o global, y quién lo aprueba?
3. ~~**Política de exclusiones de activos.**~~ **Cerrada (D74):** la propone el consultor, la aprueba la empresa y vence con el período (A3).
4. **Error técnico.** ¿Cuántos reintentos, con qué plazo, y cuándo escala a `PENDIENTE` o a `NO CUMPLE`? (REQ-012.)
5. **Vigencia de las evidencias y cada cuánto se repite cada test** (continuous compliance). Al vencer, el estado pasa solo a `VENCIDO`. (REQ-046.)
6. **El rol de la IA con los documentos.** ¿Qué umbral de confianza para sugerir? La confirmación humana ya está decidida: siempre. (REQ-047, prioridad LATER.)
7. ~~**Controles vencidos.**~~ **Cerrada (D74):** `NO CUMPLE`, como dice el comité, y es un parámetro.
8. **Probabilidad e impacto inherentes** de los 10 riesgos: la hoja `Riesgos` los trae **vacíos** y el prototipo usa valores de ejemplo. D33 había dicho que los llena el cliente; el comité pide diligenciarlos. ¿Quién?
9. **Relación causa–control completa.** Solo hay 4 causas de las 56 (F025, F029, F038, F031) con su efecto (probabilidad o impacto) y si el control es obligatorio. Falta el resto del catálogo.
10. **Versionado.** ¿Cuándo un cambio de test o de control invalida un resultado reutilizado (alcance, período y versión equivalentes)? (REQ-045.)

**Qué depende:** el riesgo residual, el apetito y el mapa de calor (MD-151) esperan las respuestas 1, 2, 8 y 9; los errores (4) condicionan MD-138 y la vigencia (5) el estado de un control. La política de exclusiones (3, MD-144) y los controles vencidos (7) ya están cerrados (D74).

## P23 · Cómo se guarda y se muestra la evaluación del consultor y la del auditor

**Estado:** abierto desde 2026-10-10 (D68). Lo planteó el responsable de producto: el consultor y el auditor **hacen cada uno una evaluación del cumplimiento sobre los mismos datos, con distinto enfoque** (el consultor prepara a la
empresa, el auditor certifica, D63 y D64). El Excel del comité no la contempla. Hoy el consultor da el veredicto de los tests documentales y manuales (§7.5) y el auditor solo escribe observaciones (§7.6).

1. **¿La evaluación del auditor es un resultado aparte** (su opinión o certificado, que se muestra al lado) **o puede cambiar el estado** que ve el cliente? *Recomendación: aparte; el estado solo lo mueven los datos.*
2. **¿La evaluación del consultor es solo por test, como hoy, o también un veredicto general** («lista» o «no lista») por servicio y marco? *Recomendación: agregar el general.*
3. ¿Se registran con la **evaluación del servicio** (servicio + marco + versión + período + fecha de corte) para que cada una diga sobre qué datos se hizo?

**Qué depende:** la pantalla del veredicto del consultor (MD-155), las observaciones (MD-154) y la evaluación del auditor, que aún no tiene ticket.

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
| **P7** | Dónde se aloja el Postgres de producción | 2026-10-10 — D72: servidor o servicio administrado separado de la app, con respaldos que sostengan los 7 años del audit trail |
| **P8** | ¿Un control que crea el cliente cuenta para el marco? | 2026-10-09 — D65: sí cuenta para el porcentaje; es solo documental, va en la categoría que elige el cliente y lo aprueba el consultor |
| **P10** | Origen de `control_dimensions` y qué es `policies` | 2026-10-01 — cerrada por desarrollo en D39: la dimensión aplica si el control tiene una prueba de ella; `policies` es una plantilla. **Falta ratificar con el comité el tipo y las banderas derivados**; no bloquea nada |
| **P11** | El nombre del proveedor en los textos de las pruebas | 2026-10-10 — D70: el cliente ve el resultado y un nombre neutro que escribe Monkey; los textos del comité son internos |
| **P12** | Cómo se conecta Monkey a la sonda (paso 3 del control técnico) | 2026-10-10 — D71: lectura por la API con un usuario de solo lectura por grupo; solo se promete lo que tiene prueba; la IP de desarrollo es una acción de infraestructura |
| **P16** | Cuándo un activo está «Preparado», «Casi listo» o «Requiere trabajo» | 2026-10-09 — D62: se lee con el porcentaje de tests con resultado, con los cortes de 100% y 80% *(el semáforo se conserva en D68)* |
| **P17** | ¿El paso 3 del onboarding exige al menos una conexión comprobada? | 2026-10-10 — D69: no; se completa al definir dónde vive el servicio e «Inicio» invita a conectar |
| **P18** | Una categoría sin nada medido, y la cobertura | 2026-10-09 — D62: no está lograda y cuenta en el denominador; la cobertura es siempre un número aparte *(D68: una categoría sin nada medido queda «en evaluación» y no cumple; la cobertura sigue aparte)* |
| **P19** | Un consultor que atiende a varias empresas, con el correo único | 2026-10-09 — D64: una sola cuenta de Next que asigna `admin_monkey` a varias empresas |
| **P20** | Quién reactiva a un consultor que la empresa suspendió | 2026-10-09 — D64: solo la empresa |
