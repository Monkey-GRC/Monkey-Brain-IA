# Roles y permisos · historias de usuario

Responde: **¿qué puede ver y hacer cada rol, qué tiene prohibido y cómo se comprueba?** Cada historia dice quién, qué y
para qué; sus criterios de aceptación son verificables y citan la regla que los fija. La definición de cada permiso es la
matriz de [`datos/modelo/05-usuarios.md`](../../datos/modelo/05-usuarios.md) §5.5; las respuestas `403` y `404`, las de
[`contracts/conventions.md`](../../../../../../contracts/conventions.md) (sección «Cumplimiento: roles, vistas y
decisiones»); las tres capas donde se hace cumplir, en [`01-c4.md`](01-c4.md); los pasos de cada caso, en
[`05-casos-de-uso.md`](05-casos-de-uso.md).

Este módulo es una **regla transversal**: no tiene pantallas propias. Sus historias no repiten cómo se crea una cuenta
([Gestión de usuarios](../gestion-usuarios/README.md)) ni cómo se sube o se revisa una evidencia (Cumplimiento): dicen
**qué le toca a cada rol** y qué se le niega. Por eso son pocas, una por rol más las que valen para todos.

**Jira:** épica [MD-264](https://rod2408.atlassian.net/browse/MD-264), una historia por fila. El cerebro manda: si una historia cambia, se actualiza aquí y después su issue.

**Roles** (D96, D102): `admin_empresa`, `responsable`, `delegado`, `auditor` (Monkey Platform) y `admin_monkey` (Monkey
Admin). «Persona» = cualquiera de ellos. No hay roles personalizados. **Estado** de cada historia: ✅ construida ·
🟡 parcial · ⚪ por construir.

## Resumen

| ID | Historia | Rol | Estado | Reglas | Jira |
|---|---|---|---|---|---|
| HU-ROL-01 | Que el servidor decida lo que mi rol puede hacer, no la pantalla | Persona | ✅ | SEG-20, §5.3 | MD-277 |
| HU-ROL-02 | No ver nunca los datos de otra empresa | Persona de Platform | ✅ | D63, SEG-66, SEG-70 | MD-278 |
| HU-ROL-03 | Que una baja o un cambio de rol se note en la siguiente petición | `admin_empresa` | ✅ | SEG-20, `CC6.3` | MD-279 |
| HU-ROL-04 | Ver y decidir todo el cumplimiento de mi empresa | `admin_empresa` | ✅ | D81, D96, D102, SEG-54, SEG-67 | MD-280 |
| HU-ROL-05 | Ver y tocar solo los controles de los que soy dueño | `responsable` | 🟡 | D102, SEG-22, SEG-54, SEG-66, SEG-67 | MD-281 |
| HU-ROL-06 | Ver y tocar solo los controles que ejecuto | `delegado` | 🟡 | D102, D121, SEG-22, SEG-66, SEG-67 | MD-282 |
| HU-ROL-07 | Leer todo el cumplimiento de la empresa sin poder cambiarlo | `auditor` | 🟡 | D63, D96, D102, SEG-21, SEG-54, SEG-67 | MD-283 |
| HU-ROL-08 | Registrar observaciones que solo yo edito y cierro | `auditor` | 🟡 | D96, SEG-70 | MD-284 |
| HU-ROL-09 | Descargar evidencias, exportar reportes y consultar el rastro | `auditor` | 🟡 | D63, §5.5 | MD-285 |
| HU-ROL-10 | Administrar la plataforma sin entrar al cumplimiento de un cliente | `admin_monkey` | ✅ | D24, D103, SEG-20 | MD-286 |
| HU-ROL-11 | Dar mi calificación del servicio sin cambiar su estado calculado | `auditor` | ⚪ | D77, P35 | MD-287 |
| HU-ROL-12 | Juzgar lo que la empresa presenta como final, con independencia | `auditor` | ⚪ | P36 | MD-288 |

---

### HU-ROL-01 · Que el servidor decida lo que mi rol puede hacer, no la pantalla

**Como** persona con cuenta, **quiero** que cada acción la autorice el servidor según mi rol **para** que nadie pueda
saltarse un permiso manipulando la pantalla o la petición.

- Cada endpoint declara los roles que lo usan (`@Roles`) y `RolesGuard` lo compara con el rol del `Principal` en cada
  petición (SEG-20, §5.3: «no confiar en el frontend»).
- El rol sale de la base (`users.role`), nunca de lo que mande el frontend ni solo del token (`conventions.md`).
- Dado un rol que no está entre los de la ruta, entonces la respuesta es `403 FORBIDDEN` y no se ejecuta nada.
- Una empresa no accede a las rutas de `admin_monkey`, y `admin_monkey` no actúa como `admin_empresa` (SEG-20).
- El menú de cada rol solo ayuda a navegar: esconder una opción no la protege; la barrera es el servidor.

### HU-ROL-02 · No ver nunca los datos de otra empresa

**Como** persona de una empresa, **quiero** que todo lo que consulte o cambie quede dentro de mi empresa **para** que
nuestra información no la vea ni la toque nadie de fuera.

- El aislamiento lo hace la base (RLS con `app.tenant_id`, capa 2 de [`01-c4.md`](01-c4.md)); el código no filtra a mano.
- Dado un recurso de otra empresa, entonces la respuesta es `404 NOT_FOUND`, no `403`: que exista no se informa
  (`conventions.md`, SEG-66, SEG-70).
- El `auditor` no tiene excepción de aislamiento: su cuenta pertenece a la empresa y solo ve esa empresa (D63).

### HU-ROL-03 · Que una baja o un cambio de rol se note en la siguiente petición

**Como** administrador de la empresa, **quiero** que desactivar a alguien o cambiar su rol surta efecto de inmediato
**para** retirar un acceso sin esperar a que su sesión venza (`CC6.3`).

- El rol y el estado se leen de la base en cada petición, no del token ([`03-flujos.md`](03-flujos.md) §2, SEG-20).
- Dado un usuario desactivado con la sesión abierta, cuando hace la siguiente petición, entonces su sesión se cierra y
  recibe `403 ACCOUNT_INACTIVE` (`contracts/autenticacion.md`).
- Dado un cambio de rol, la siguiente petición ya se autoriza con el rol nuevo.
- Dar de baja es desactivar, nunca borrar: el historial donde participó se conserva (D102 punto 10).

### HU-ROL-04 · Ver y decidir todo el cumplimiento de mi empresa

**Como** administrador de la empresa, el experto en compliance, **quiero** ver todo lo de mi empresa y ser quien decide
**para** llevar el cumplimiento y responder por él ante el auditor.

- Veo todos los controles, riesgos, evidencias y la cadena (dueño y ejecutor) de todos los servicios, y el avance de
  cada servicio × marco (§5.5, D102 punto 9).
- Puedo pedir la vista técnica (`?view=technical`): códigos, requisitos, todas las pruebas y resultados por check (D81,
  SEG-54).
- Soy el único que asigna y reasigna el dueño de un control, a un `responsable` o a mí mismo (D102 punto 6), el único que
  decide una exclusión (SEG-67) y el único que crea, edita o da de baja controles, riesgos y causas (§5.5, D96 punto 8).
- Puedo revisar cualquier evidencia y cualquier veredicto, también lo que subí yo cuando soy dueño del control (SEG-67).
  Que en ese caso me califique a mí mismo es la pregunta abierta `P34`: no se resuelve aquí.
- Respondo las observaciones del auditor, pero no puedo escribirlas, editarlas ni cerrarlas (`403 FORBIDDEN`, SEG-70).

### HU-ROL-05 · Ver y tocar solo los controles de los que soy dueño

**Como** responsable, **quiero** ver solo los controles de los que soy dueño y los que ejecutan mis delegados **para**
concentrarme en lo mío sin ver el trabajo del resto de la empresa.

- Las listas llegan filtradas a mis controles; sin controles asignados, vacías, sin error (SEG-22, SEG-66).
- Dado un control de mi empresa que no es mío, cuando lo pido o escribo algo en él, entonces `403 FORBIDDEN` (SEG-66,
  `conventions.md`).
- Veo el avance de lo mío, nunca el de la empresa (D102 punto 9, D118); la vista técnica me responde `403` (SEG-54).
- Reviso la evidencia y el veredicto de mis controles que **no** subió ni registró yo; lo mío lo revisa el
  `admin_empresa` (SEG-67).
- Asigno el ejecutor solo entre los delegados de mi equipo, y creo delegados solo para mi equipo (D102 puntos 2 y 6).
- No edito controles ni riesgos, no decido exclusiones y no asigno dueños (`403`, §5.5).
- *Parcial:* la API está construida (MD-193, MD-194); faltan las pantallas «Mi trabajo» (MD-201), la visibilidad sin
  avance de la empresa (MD-202) y la revisión en dos niveles (MD-203) (SEG-21 🟠).

### HU-ROL-06 · Ver y tocar solo los controles que ejecuto

**Como** delegado, **quiero** ver solo los controles que mi responsable me asignó para ejecutar **para** saber qué me
toca subir o corregir.

- Veo solo los controles en los que soy ejecutor; sin ninguno, listas vacías (SEG-22, SEG-66).
- Lo de mi empresa que no ejecuto responde `403`; lo de otra empresa, `404` (SEG-66).
- Subo evidencia y registro el veredicto de una prueba manual, que nace pendiente de revisión (D121); **no reviso**: aprobar
  o rechazar una evidencia o un veredicto me responde `403` (SEG-67).
- No creo a nadie ni asigno nada (`403`, D102 punto 2); la vista técnica me responde `403` (SEG-54).
- Respondo las observaciones del auditor sobre los controles que ejecuto (SEG-70).
- *Parcial:* la API está construida (MD-193, MD-194); faltan las pantallas «Mi trabajo» (MD-201) y la visibilidad
  (MD-202) (SEG-21 🟠).

### HU-ROL-07 · Leer todo el cumplimiento de la empresa sin poder cambiarlo

**Como** auditor, **quiero** ver todo el cumplimiento de la empresa que me creó la cuenta, sin poder cambiarlo, **para**
formarme un juicio sobre lo que la empresa lleva en Monkey.

- Veo todos los servicios, controles, pruebas, riesgos y evidencias de la empresa, sin restricción de asignación (D63,
  §5.5).
- Veo la cadena: el dueño y el ejecutor de cada control (D102 punto 9).
- Puedo pedir la vista técnica (D81, SEG-54).
- No reviso evidencias ni veredictos, no registro veredictos, no decido exclusiones y no edito controles ni riesgos:
  todo eso me responde `403` (SEG-67, `contracts/cumplimiento/README.md` «Quién puede qué»).
- No creo ni edito usuarios (`403`, `contracts/gestion-usuarios.md`).
- *Parcial:* la API de lectura está construida (MD-193); falta mostrar la cadena en el detalle del control (MD-202)
  (SEG-21 🟠).

### HU-ROL-08 · Registrar observaciones que solo yo edito y cierro

**Como** auditor, **quiero** escribir observaciones sobre un control **para** pedir información o señalar algo que la
empresa debe atender, sin cambiar yo nada.

- Solo el `auditor` escribe observaciones; cualquier otro rol recibe `403` (SEG-70).
- Solo su autor la edita, la devuelve a `open` o la cierra; otro auditor recibe `403`, antes que cualquier regla de
  estado (SEG-70).
- La responden el `admin_empresa`, el dueño o el ejecutor del control; el `responsable` y el `delegado` solo ven las de
  sus controles (SEG-70).
- Una cerrada no se reabre ni se edita (`409 OBSERVATION_CLOSED`); cerrar una que no está `answered` es
  `409 INVALID_TRANSITION` (`contracts/cumplimiento/observaciones.md`).
- Las observaciones no mueven el porcentaje (D63).
- *Parcial:* la API está construida (MD-154, MD-193); Monkey Platform aún no tiene la pantalla «Auditoría»
  (`context/frontend.md`).

### HU-ROL-09 · Descargar evidencias, exportar reportes y consultar el rastro

**Como** auditor, **quiero** descargar las evidencias, exportar reportes y consultar el rastro de auditoría **para**
llevarme lo que necesito revisar fuera de Monkey.

- Descargo el archivo de cualquier evidencia de la empresa con un enlace temporal (D63; construido en MD-126,
  `contracts/cumplimiento/evidencia.md`).
- Exporto reportes en PDF y Excel, y veo el rastro de auditoría de la empresa (§5.5, D63).
- *Parcial:* la exportación de reportes y la consulta del rastro aún no tienen contrato; se acuerdan primero
  (regla 6 de `CLAUDE.md`).

### HU-ROL-10 · Administrar la plataforma sin entrar al cumplimiento de un cliente

**Como** administrador de Monkey, **quiero** gestionar empresas, catálogo y cupos sin tocar el escenario de ningún
cliente **para** que cada empresa sea dueña de sus datos.

- Registro y archivo empresas, administro el catálogo maestro y fijo el cupo de usuarios de cada empresa (D103, §5.5).
- No creo ni desactivo cuentas de una empresa, no creo controles ni riesgos de un cliente (§5.1, §5.5).
- Los endpoints de Cumplimiento me responden `403` hasta que exista una vista de solo lectura propia (MD-146,
  `conventions.md`); los de la empresa, también (SEG-20).
- Entro solo a Monkey Admin: Monkey Platform no me admite (D24).

### HU-ROL-11 · Dar mi calificación del servicio sin cambiar su estado calculado

**Como** auditor, **quiero** emitir mi calificación (certificar o no el marco) **para** dejar mi juicio en Monkey.

- En pausa: la calificación del auditor no se construye por ahora (D96 punto 9) y se diseñará según lo que pida el Excel
  del comité (`P35`, abierta).
- Lo único decidido: cuando vuelva, no cambia el estado calculado del servicio (D77, `P35`).

### HU-ROL-12 · Juzgar lo que la empresa presenta como final, con independencia

**Como** auditor, **quiero** formarme mi juicio sobre lo que la empresa presenta como final **para** auditar con
independencia de quien me creó la cuenta.

- Hoy la empresa crea al auditor y él ve todo, incluidas las versiones rechazadas de una evidencia (`P36`).
- Si ve solo la versión vigente, si la revisión pasa a ser histórico inmutable y si hace falta una declaración de
  independencia al crearlo son preguntas abiertas de `P36` (MD-183): no se resuelven aquí.
