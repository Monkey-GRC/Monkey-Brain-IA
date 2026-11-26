# Cumplimiento · historias de usuario

> **VF18 (D128): estas historias describen el cumplimiento construido (v1).** La regla vigente (requisitos del control, nivel 0 a 5, aprobación por control, apetito por zona) está en D130 a D135; cada historia lo indica donde cambia.

Responde: **¿qué necesita cada persona para saber si un servicio cumple un marco, aportar y revisar los hechos que lo
deciden (evidencia, veredictos, exclusiones), atender al auditor y gestionar sus riesgos; y cómo se comprueba que lo
tiene?** Cada historia dice quién, qué y para qué; sus criterios citan la regla que los fija. Cuerpos y errores, en el
[contrato](../../../../../../contracts/cumplimiento/README.md) (un archivo por componente); la secuencia, en
[`03-flujos.md`](03-flujos.md) y el de cada componente; los pasos, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Fuera de este módulo:** evaluar los riesgos al dar de alta el servicio es [HU-ONB-13](../onboarding/04-historias.md);
ver qué falló en una prueba automática, [HU-CT-06](../control-tecnico/04-historias.md); ver solo lo mío y «Mi
trabajo», [HU-USR-18 y 19](../gestion-usuarios/04-historias.md); asignar dueño y ejecutor, HU-USR-15 y 16.

**Roles** (D96, D102): `admin_empresa` (el experto en compliance: decide, valida y edita), `responsable` (dueño de sus
controles), `delegado` (ejecutor) y `auditor` (lee todo y escribe observaciones; no califica). «Persona de empresa» =
cualquiera de los cuatro; el `responsable` y el `delegado` ven y tocan **solo lo de sus controles** (SEG-66): lo ajeno
de su empresa es `403`, lo de otra empresa `404`. **Estado:** ✅ construida · 🟡 parcial · ⚪ por construir.
Ante el cliente, los motores son «sonda» o «evaluación automática» (regla 1).

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-CUM-01 | Ver el estado de cada marco del servicio con su avance y cobertura | Persona de empresa | ✅ | D62, D80, D87, D118 |
| HU-CUM-02 | Declarar el período auditado de un marco | `admin_empresa` | ✅ | D87, D105, D145 |
| HU-CUM-03 | Pedir la vista técnica del resumen y de los controles | `admin_empresa` · `auditor` | ✅ | D81, D96 |
| HU-CUM-04 | Ver los controles del servicio con su estado, su código y qué falta | Persona de empresa | ✅ | D80, D62, D102 |
| HU-CUM-05 | Ver el detalle de un control y sus pruebas | Persona de empresa | ✅ | D70, D82, D85 |
| HU-CUM-06 | Crear un control propio | `admin_empresa` | 🟡 | D65, D96, D102 |
| HU-CUM-07 | Ajustar la interpretación o las dimensiones de un control | `admin_empresa` | ✅ | D96 |
| HU-CUM-08 | Dar de baja un control sin perder su historial | `admin_empresa` | ✅ | D96, D119 |
| HU-CUM-09 | Saber qué cambia antes de confirmar una edición o una baja | `admin_empresa` | ⚪ | `P33` |
| HU-CUM-10 | Ver los controles agrupados en un marco sin categorías | Persona de empresa | ⚪ | `P27` |
| HU-CUM-11 | Subir la evidencia de una prueba documental | `admin_empresa` · `responsable` · `delegado` | ✅ | D88, D102, SEG-60 |
| HU-CUM-12 | Ver en un solo lugar las evidencias que me tocan | Persona de empresa | ✅ | D102, MD-208 |
| HU-CUM-13 | Ver o descargar una evidencia sin exponer el archivo | Persona de empresa | ✅ | SEG-60, MD-177 |
| HU-CUM-14 | Validar o rechazar una evidencia | `responsable` dueño · `admin_empresa` | 🟡 | D102, SEG-67; con la VF18, D132 |
| HU-CUM-15 | Que ninguna IA dé por buena una evidencia | Persona de empresa | ✅ | Regla 3, RN-03 |
| HU-CUM-16 | Gestionar los requerimientos propios de un control | `admin_empresa` | 🟡 | D88 |
| HU-CUM-17 | Registrar el veredicto de una prueba manual | `admin_empresa` · `responsable` · `delegado` | 🟡 | D85, D121, `P37` |
| HU-CUM-18 | Aprobar o rechazar un veredicto | `responsable` dueño · `admin_empresa` | 🟡 | D121 (reemplazada por D132), SEG-67 |
| HU-CUM-19 | Consultar el historial de veredictos de una prueba | Persona de empresa | 🟡 | D121, D119 |
| HU-CUM-20 | Excluir un activo de una prueba con motivo y vigencia | `admin_empresa` | 🟡 | D96, D87, SEG-67 |
| HU-CUM-21 | Ver las exclusiones del servicio y cuáles vencieron | `admin_empresa` · `auditor` | ✅ | D96, DT-72 |
| HU-CUM-22 | Escribir una observación sobre un servicio, un control o una evidencia | `auditor` | 🟡 | D96, SEG-69, SEG-70 |
| HU-CUM-23 | Responder una observación | `admin_empresa` · `responsable` · `delegado` | 🟡 | SEG-70, `P37`, D143 |
| HU-CUM-24 | Cerrar o devolver una observación que escribí | `auditor` (su autor) | 🟡 | SEG-69, SEG-70 |
| HU-CUM-25 | Ver los riesgos y causas del servicio en el mapa de calor | Persona de empresa | ✅ | D33, D76, D102 |
| HU-CUM-26 | Crear, editar, dar de baja y reactivar riesgos y causas | `admin_empresa` | ✅ | D28, D93, D96 |
| HU-CUM-27 | Vincular causas a riesgos y controles a causas | `admin_empresa` | ✅ | D96 |
| HU-CUM-28 | Reevaluar un riesgo y ver cómo cambió | `admin_empresa` · `auditor` | ✅ | D33, D76 |
| HU-CUM-29 | Decidir el tratamiento de un riesgo | `admin_empresa` | ✅ | D30 |
| HU-CUM-30 | Ver el riesgo residual y las matrices inherente y residual | `admin_empresa` · `auditor` | ⚪ | D134 |
| HU-CUM-31 | Que lo no medido nunca cuente como cumplido | Persona de empresa | ✅ | D62, D68, §9, DT-50 |
| HU-CUM-32 | Calificar el marco de un servicio como auditor | `auditor` | ⚪ | D96, `P35` |

---

## Resumen del servicio

### HU-CUM-01 · Ver el estado de cada marco del servicio con su avance y cobertura

**Como** persona de la empresa, **quiero** ver cada marco contratado del servicio con sus categorías **para** saber
qué tan cerca está de la auditoría y qué falla.

- La unidad es servicio × marco; nunca hay un porcentaje de «toda la empresa» (D80).
- El semáforo sale junto al porcentaje y a la cobertura; con cobertura baja un marco no es «Listo» (D80).
- El porcentaje cuenta controles únicos efectivos; no promedia porcentajes (D62).
- Sin período auditado, el marco sale «Sin medir» y no se inventa ningún número (D87).
- «Lo que falla» trae el código del control (`CC6.1`, `IAC-12`) y los requisitos que cubre (D80).
- El `responsable` y el `delegado` reciben solo los marcos y categorías con controles suyos (D118).

### HU-CUM-02 · Declarar el período auditado de un marco

**Como** `admin_empresa`, **quiero** fijar el inicio y el fin del período que se audita **para** que el motor pueda
medir el marco.

- Las fechas se eligen en un calendario; inicio y fin pueden ser el mismo día (Tipo I) (D87, D105); **desde D145 (MD-500) solo hay Tipo II: el fin debe ser posterior al inicio y, en SOC 2, el período dura al menos 6 meses** (`period.invalid_range`, `period.too_short`).
- Inicio después del fin → `422 period.invalid_range`; un marco no contratado → `404`.
- La fecha de corte es siempre «hoy»: la pantalla no la ofrece ni la congela (D105).
- Cada cambio deja en el rastro el valor anterior y el nuevo, en la misma transacción.
- Al llegar el período siguiente se abre solo, con la misma duración, y el anterior queda como histórico (D145).

### HU-CUM-03 · Pedir la vista técnica del resumen y de los controles

**Como** `admin_empresa` o `auditor`, **quiero** ver los estados del motor, las pruebas y los puntos de enfoque
**para** entender por qué un control está como está.

- `?view=technical` solo para `admin_empresa` y `auditor`; el `responsable` y el `delegado` reciben `403` (D81, D96).
- El estado técnico manda sobre el semáforo: un control que no cumple deja el marco en `non_compliant` aunque el
  semáforo diga «Casi listo».

## Controles

### HU-CUM-04 · Ver los controles del servicio con su estado, su código y qué falta

**Como** persona de la empresa, **quiero** la lista de controles con su estado, avance y cobertura **para** saber
qué atender primero.

- Cada control muestra su código y los de los requisitos que cubre, para todos los roles (D80).
- Se filtra por categoría, tipo, semáforo, origen y responsable; «Sin asignar» solo lo pide el `admin_empresa`.
- Los dados de baja no salen. Un `responsable` o `delegado` ve solo los suyos; sin ninguno, la lista llega vacía (D102).

### HU-CUM-05 · Ver el detalle de un control y sus pruebas

**Como** persona de la empresa, **quiero** abrir un control y ver sus pruebas, su evidencia y lo que falla **para**
saber qué hacer.

- Cada prueba sale con un nombre neutro; nunca con el texto del comité ni el nombre del proveedor (D70, D82).
- Una prueba compartida dice en qué otros controles vigentes cuenta (D85).
- Un control ajeno de mi empresa es `403`; uno dado de baja, `404`.

### HU-CUM-06 · Crear un control propio

**Como** `admin_empresa`, **quiero** agregar un control que el catálogo no trae **para** reflejar cómo opera mi empresa.

- Es solo documental (`policy`, `manual`) y va en una categoría contratada (`category.not_in_scope`) (D65).
- Nace aprobado, cuenta desde ya, recibe el siguiente código propio (`C01`) y nace «Sin asignar» (D96, D102).
- 🟡 La API está construida; la pantalla no ofrece crearlo.

### HU-CUM-07 · Ajustar la interpretación o las dimensiones de un control

**Como** `admin_empresa`, **quiero** reescribir cómo aplica un control o marcar que una dimensión no aplica **para**
que se mida lo que de verdad existe.

- El cambio es inmediato; la interpretación queda marcada como personalizada y conserva la original.
- Una dimensión que no aplica exige el motivo (`reason.required`); un control propio solo admite `policy`.
- Si cambia lo que se mide, queda el evento de cumplimiento en la misma transacción. Editar uno de baja → `409 CONTROL_RETIRED`.

### HU-CUM-08 · Dar de baja un control sin perder su historial

**Como** `admin_empresa`, **quiero** dar de baja un control que ya no aplica **para** que deje de contar sin borrar
lo que se hizo.

- Es baja, no borrado: deja de contar y de verse; repetirla es `409 CONTROL_RETIRED` (D96).
- Sus evidencias, veredictos y observaciones se siguen leyendo con la misma regla de alcance (D119).
- Ya no admite evidencia, veredictos ni observaciones nuevas (`409 CONTROL_RETIRED`).

### HU-CUM-09 · Saber qué cambia antes de confirmar una edición o una baja

> ⚪ **Depende de `P33`, abierta** (qué advierte la pantalla y si pide motivo). No se resuelve aquí.

**Como** `admin_empresa`, **quiero** ver qué pruebas dejan de contar y cómo se mueve el avance antes de confirmar
**para** no cambiar el resultado del servicio sin darme cuenta.

### HU-CUM-10 · Ver los controles agrupados en un marco sin categorías

> ⚪ **Depende de `P27`, abierta** (agrupación de ISO 27001, NIST CSF o PCI DSS). Para el MVP (SOC 2) no bloquea.

**Como** persona de la empresa, **quiero** ver los controles de un marco que no usa criterios de confianza agrupados
de forma útil **para** recorrerlo igual que SOC 2.

## Evidencia

### HU-CUM-11 · Subir la evidencia de una prueba documental

**Como** quien trabaja un control, **quiero** subir el documento que respalda una prueba **para** que se pueda validar.

- Suben el ejecutor, el dueño o el `admin_empresa`, siempre sobre un control suyo; el `auditor` no (D102).
- PDF, DOCX, XLSX, PNG o JPG hasta 25 MB, con el contenido que declara (`415`, `413`) (SEG-60).
- Cada subida es una versión nueva con su huella SHA-256; nunca pisa la anterior.
- Subir no valida: la entrega nace pendiente y devuelve la prueba a revisión (D88).
- Un control dado de baja → `409 CONTROL_RETIRED`.

### HU-CUM-12 · Ver en un solo lugar las evidencias que me tocan

**Como** persona de la empresa, **quiero** la pestaña Evidencias con lo requerido y lo entregado de los controles que
veo **para** no recorrer control por control.

- Una sola petición por servicio, con el mismo número de consultas sea cual sea el tamaño (MD-208).
- Quien ve un control ve todos sus requerimientos; cada uno con su estado de evidencia.

### HU-CUM-13 · Ver o descargar una evidencia sin exponer el archivo

**Como** persona de la empresa o auditor, **quiero** abrir una entrega **para** revisarla.

- El enlace es firmado y dura 5 minutos; el archivo nunca está en una URL pública.
- PDF, PNG y JPG se ven sin descargar; otro tipo en vista previa → `422 disposition.not_supported`.
- Cada descarga queda en el rastro sin la URL firmada. Sin almacenamiento → `503 STORAGE_UNAVAILABLE`.

### HU-CUM-14 · Validar o rechazar una evidencia

**Como** dueño del control o `admin_empresa`, **quiero** validar o rechazar lo que se subió **para** que la prueba
documental cuente o se corrija.

- Revisa el `responsable` dueño (lo que no subió él) y el `admin_empresa` (cualquiera); `delegado` y `auditor`, `403` (SEG-67).
- Rechazar exige una nota (`422 note.required`): es lo que lee quien subió.
- Una revisión por rol; cualquier rechazo gana; sin revisión, pendiente (D102).
- Quien subió no revisa lo suyo, salvo el `admin_empresa` dueño, cuya aprobación es la final (D132).
- 🟡 La API está construida (MD-194); las pantallas de revisión faltan (SEG-21).

### HU-CUM-15 · Que ninguna IA dé por buena una evidencia

**Como** persona de la empresa, **quiero** que solo una persona valide **para** que el cumplimiento sea defendible
ante el auditor.

- Nadie puede enviar `ai_prevalidated`: lo deriva el sistema (`422 enum.invalid`); la IA puede dejarla `in_review`,
  nunca validada (regla 3, RN-03).
- Hoy la IA no escribe nada aquí (`ai_confidence` y `ai_suggestion` en `null`).

### HU-CUM-16 · Gestionar los requerimientos propios de un control

**Como** `admin_empresa`, **quiero** pedir un documento que el catálogo no trae y cambiar su responsable **para**
adaptar la evidencia a mi operación.

- Un requerimiento propio puede ir a una prueba documental del control (`test.not_manual`, `test.not_in_control`) (D88).
- Solo se quita uno propio y sin entregas (`409 REQUIREMENT_NOT_REMOVABLE`).
- 🟡 Crear está construido (solo API, la pantalla sube por prueba); cambiar el responsable y quitar, no.

## Veredictos

> **Retirado en MD-504 (2026-11-25):** el veredicto, su revisión y su historial ya no existen; el resultado manual y la aprobación del control están en `contracts/cumplimiento/aprobacion.md`. Se conserva como historia; falta escribir las historias y los casos de uso del nuevo flujo.

### HU-CUM-17 · Registrar el veredicto de una prueba manual

**Como** quien trabaja un control o `admin_empresa`, **quiero** registrar si una prueba manual no documental cumple
**para** cerrarla sin documento.

- Una automática → `409 TEST_NOT_MANUAL`; una documental → `409 TEST_DECIDED_BY_EVIDENCE` (D88).
- Vale para todos los controles del servicio que llevan la prueba (D85).
- Nace pendiente y no cuenta; si lo registra el `admin_empresa`, nace aprobado (D121).
- Con observaciones abiertas en el control exige el motivo (`422 closure_reason.required`, criterio provisional, `P37`).
- 🟡 La API está construida (MD-194); la pantalla no ofrece registrarlo.

### HU-CUM-18 · Aprobar o rechazar un veredicto

**Como** dueño del control o `admin_empresa`, **quiero** revisar un veredicto **para** que solo cuente lo que alguien
más comprobó.

- El dueño revisa lo que no registró él; el `admin_empresa`, todo; los demás, `403` (D121, SEG-67).
- Rechazar exige nota; un rechazo gana; cuenta el último veredicto del test (D121).
- Si ya hay uno más nuevo de la prueba → `409 VERDICT_SUPERSEDED`.
- 🟡 La API está construida; la pantalla falta.

### HU-CUM-19 · Consultar el historial de veredictos de una prueba

**Como** persona de la empresa o auditor, **quiero** ver los veredictos de una prueba con sus revisiones **para**
saber quién decidió qué y cuándo.

- Nada se pisa: un veredicto no se edita ni se borra (D121); los de un control dado de baja se siguen leyendo (D119).
- 🟡 La API está construida; la pantalla no lo muestra.

## Exclusiones

### HU-CUM-20 · Excluir un activo de una prueba con motivo y vigencia

**Como** `admin_empresa`, **quiero** sacar un activo de una prueba que no le aplica **para** no medir lo que no corresponde.

- Solo el `admin_empresa` decide, y propone y aprueba en un acto (D96, SEG-67).
- El motivo es obligatorio, y el técnico también si la prueba es automática.
- Vale desde hoy hasta el fin del período; sin período → `409 EVALUATION_NOT_DEFINED` (D87).
- El resultado medido no se toca: el activo sale del universo de la prueba al leer.
- Repetir una vigente → `409 EXCLUSION_ALREADY_EXISTS`. Excluir un check suelto no existe (DT-74).
- 🟡 La API está construida; la pantalla solo lista.

### HU-CUM-21 · Ver las exclusiones del servicio y cuáles vencieron

**Como** `admin_empresa` o `auditor`, **quiero** ver qué se excluyó, por qué, quién y hasta cuándo **para** responder
al auditor.

- El `responsable` y el `delegado` reciben `403`.
- «Vencida» se deriva al leer; al vencer, el activo vuelve a contar sin ningún proceso (DT-72).

## Observaciones del auditor

### HU-CUM-22 · Escribir una observación sobre un servicio, un control o una evidencia

**Como** `auditor`, **quiero** señalar algo que no me cuadra, recomendar o pedir información **para** que la empresa lo atienda.

- Solo el `auditor` escribe (SEG-70); tipo observación, recomendación o solicitud de información.
- Una observación no mueve el porcentaje ni califica (D96).
- Sobre una evidencia queda también en su control; sobre un control de baja → `409 CONTROL_RETIRED`.
- Nunca se borra (SEG-69: lo impone la base). 🟡 La API está construida; la pantalla falta.

### HU-CUM-23 · Responder una observación

**Como** `admin_empresa`, dueño o ejecutor del control, **quiero** responder con una nota y, si hace falta, una
evidencia **para** dar el asunto por atendido.

- Las de un servicio completo las atiende solo el `admin_empresa` (SEG-70).
- La evidencia adjunta es de un control del mismo servicio; para que cuente se valida aparte (`P37`).
- Responder una ya respondida → `409 OBSERVATION_NOT_OPEN`.
- No hay aviso de que existe una nueva (decidido en D143; lo construye MD-515). 🟡 La API está construida; la pantalla falta.

### HU-CUM-24 · Cerrar o devolver una observación que escribí

**Como** `auditor` autor, **quiero** cerrarla si quedo conforme o devolverla a abierta si no **para** dejar constancia.

- Solo su autor; los demás, `403` antes que cualquier error de estado (SEG-70).
- Solo se cierra o devuelve una respondida (`409 INVALID_TRANSITION`); una cerrada no se toca ni se reabre
  (`409 OBSERVATION_CLOSED`, SEG-69). 🟡 La API está construida; la pantalla falta.

## Riesgos

### HU-CUM-25 · Ver los riesgos y causas del servicio en el mapa de calor

**Como** persona de la empresa, **quiero** ver los riesgos del servicio con su nivel **para** saber dónde estoy expuesto.

- Los riesgos son de cada servicio (copias del catálogo, D28); el nivel sale de la misma función que la matriz 5×5 (D76).
- El `responsable` y el `delegado` ven solo los que llegan a un control suyo (D102).

### HU-CUM-26 · Crear, editar, dar de baja y reactivar riesgos y causas

**Como** `admin_empresa`, **quiero** agregar un riesgo o una causa propios y retirar el que no aplica **para** que el
mapa refleje mi servicio.

- Solo el `admin_empresa`; el resto, `403` (D96). Un código repetido → `409 CODE_ALREADY_EXISTS`.
- Dar de baja un riesgo no retira sus causas ni sus controles; reactivarlo conserva su evaluación (D93).

### HU-CUM-27 · Vincular causas a riesgos y controles a causas

**Como** `admin_empresa`, **quiero** relacionar riesgos, causas y controles **para** ver qué ataca cada causa.

- Ambos lados son del mismo servicio y empresa (`404` si no); repetir → `409 LINK_ALREADY_EXISTS`.
- Quitar un vínculo no borra el riesgo, la causa ni el control.

### HU-CUM-28 · Reevaluar un riesgo y ver cómo cambió

**Como** `admin_empresa`, **quiero** volver a poner probabilidad e impacto (1 a 5) **para** reflejar cómo cambió la exposición.

- El servidor calcula el valor (producto) y el nivel (D33, D76); un riesgo de baja → `409 RISK_INACTIVE`.
- Cada evaluación queda en el historial, que leen el `admin_empresa` y el `auditor`.

### HU-CUM-29 · Decidir el tratamiento de un riesgo

**Como** `admin_empresa`, **quiero** registrar qué se hará, quién responde y para cuándo **para** dejar el plan a la vista del auditor.

- El responsable es un cargo de la empresa (D30); la fecha es hoy o después (`422 date.past`).
- Cada decisión es una fila nueva; la vigente es la última.

### HU-CUM-30 · Ver el riesgo residual y las matrices inherente y residual

> ⚪ **Sin construir; la regla es D134** (cobertura verificada y umbrales; el efecto de cada relación ya no hace falta). La
> fórmula está adoptada (D75); el dato no.

**Como** `admin_empresa` o `auditor`, **quiero** ver cuánto riesgo queda cuando los controles funcionan **para**
compararlo con el apetito de riesgo.

## Garantías del cálculo

### HU-CUM-31 · Que lo no medido nunca cuente como cumplido

**Como** persona de la empresa, **quiero** que el estado solo diga «cumple» con hechos **para** no llegar engañado a la auditoría.

- Pendiente, sin activos, sin evidencia o sin ejecución nunca producen «cumple» (§9, D68).
- Todo o nada en cada nivel; lo que falla prevalece sobre lo pendiente (D62).
- El cumplimiento no se guarda: se calcula al leer; cada escritura que lo mueve deja un evento de cambio de estado.
- Un fallo de la sonda hoy se ve como pendiente, no como incumplimiento (DT-50).

### HU-CUM-32 · Calificar el marco de un servicio como auditor

> ⚪ **En pausa (D96) y dependiente de `P35`, abierta.** Los endpoints de evaluación del auditor se retiraron.

**Como** `auditor`, **quiero** emitir mi calificación del marco **para** cerrar la auditoría en Monkey.
