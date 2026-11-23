# Decisiones — Cumplimiento · Veredictos

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/veredictos/`](../../../arquitectura/cumplimiento/veredictos/README.md). Índice del módulo: [`README.md`](README.md).

## D85 · El veredicto de un test manual o documental vale para todos los controles que lo usan (2026-10-17)

> **Ajustada por D96 (2026-10-27).** El veredicto lo da el `admin_empresa` (no el consultor). Se mantiene que vale para todos los controles que usan la prueba.

> **Ajustada por D88 (2026-10-22):** para las pruebas **documentales** ya no rige; su estado es por control y sale de la revisión de la evidencia. D85 sigue para las demás pruebas manuales.

**Decisión.**
1. El veredicto es **por test y por servicio** (RN-13): se da una vez y cuenta en todos los controles del servicio que llevan ese test. Se sigue dando desde un control (`/v1/controls/{control_id}/tests/{test_id}/verdicts`); ese `control_id` queda como el **control de origen**, informativo.
2. Las **evidencias de un test** son las de los requerimientos de los controles del servicio que lo llevan, con la dimensión del test, sin duplicados. Se sube al requerimiento de un control y vale para el test en todos ellos.
3. La pantalla avisa en qué otros controles aplica el test (`shared_with`), para que quien sube o decide sepa que repercute.
4. Las observaciones abiertas que obligan a explicar el cierre (`closure_observation_reason`) se comprueban sobre el **control de origen**. *Criterio provisional de desarrollo; si el comité pide revisar las de todos los controles, se ajusta.*

**Por qué.** RN-13 ya dice que un resultado se calcula una vez por test × servicio × período × versión y lo consumen todos los controles; pedir un veredicto por control obligaría a repetir el trabajo y daría resultados distintos para el mismo test. El modelo no decía qué evidencias sustentan un test compartido.

**Lo que no cambia.** El veredicto sigue siendo del consultor, inmutable (la anterior se conserva) y con quien lo confirmó.

**Qué cambia.** `contracts/cumplimiento/veredictos.md` (veredictos, lista de tests y evidencia por test) y `contracts/cumplimiento/evidencia.md`. `evaluations.client_control_id` se conserva como control de origen; al construir MD-155 hay que comprobar que el motor lee por test, no por control.

**Fuente:** responsable de producto, 2026-10-17; RN-13.

---

---

## D88 · Una prueba documental se valida en su control, con la evidencia que la persona sube para ESA prueba (2026-10-22; ajusta D85 y cierra P25)

> **Reemplazada por D132 y D133 (2026-11-22).** La prueba documental es una por documento y se resuelve con su flujo de aprobación y aceptación (D133); la aprobación es del control, no de cada evidencia (D132).

> **Ajustada por D96 (2026-10-27).** Quien valida es el `admin_empresa` (no el consultor); la evidencia de una prueba la sube el `funcional` responsable de su dimensión. Se mantiene todo lo demás: se valida en el control, con la evidencia de esa prueba.

**Decisión.**
1. **El estado de una prueba documental (`dimension = policy`) es por control.** La persona lee lo que pide la prueba y **sube su documento bajo ella**; el consultor lo revisa después. El estado de la prueba en ese control sale de **esas** entregas, con la agregación de RN-04 (`NO CUMPLE` > `VENCIDA` > `EN REVISIÓN` > `PENDIENTE` > `CUMPLE`). Sin entregas es `pending`: la ausencia de evidencia nunca es cumplimiento. Que `T-DOC-001` cumpla en `IAC-12` no dice nada de `T-DOC-001` en `IAC-4`, ni de `T-DOC-002` en `IAC-12`: cada prueba de cada control tiene su evidencia.
2. **Validar la evidencia es el veredicto de una prueba documental** (responde la pregunta 2 de P25, con su recomendación): el consultor revisa cada entrega (`PUT /v1/evidence-submissions/{id}/review`, D84) y de esa revisión sale el estado. **No hay un segundo paso.** `POST …/tests/{test_id}/verdicts` queda para las pruebas manuales que **no** son documentales (`technical_manual`, p. ej. la validación complementaria de una prueba técnica) y responde `409 TEST_DECIDED_BY_EVIDENCE` sobre una documental.
3. **Se sube en un solo paso, bajo la prueba:** `POST /v1/controls/{control_id}/tests/{test_id}/evidence` (archivo). La primera entrega crea el lugar de esa prueba en ese control (un requerimiento propio con `test_id` = la prueba) y las siguientes son versiones nuevas del mismo lugar. No hay que preparar nada antes. `evidence_requirements.test_id` (nullable, FK a `catalog.tests`) liga cada requerimiento con la prueba a la que sirve.
4. **Los documentos que trae el catálogo son una sugerencia, no cuentan para ninguna prueba.** Las 89 asignaciones del Excel del comité no dicen a qué prueba sirve cada documento, así que se clonan con `test_id` nulo, se muestran como guía («el catálogo sugiere estos documentos para el control») y **no entran al cálculo de ninguna prueba**. Cuando el comité las asigne (`catalog.control_evidence_templates.test_id`, que el clonado copia), serán el lugar de esa prueba. Un control sin documento en el Excel (`B7`, 52 de 119) no queda sin dónde subir: todas sus pruebas documentales aceptan evidencia.
5. **Una versión nueva reemplaza a la anterior en el cálculo:** el estado de un requerimiento es el de su entrega más reciente; las anteriores y sus revisiones quedan como histórico. Una entrega nueva nace `pending`, así que subirla tras un `CUMPLE` devuelve la prueba a revisión.
6. `POST /v1/controls/{id}/evidence-requirements` (con `test_id` opcional) sigue existiendo para quien quiera nombrar un documento propio; la pantalla no lo necesita. `GET /v1/controls/{control_id}/tests/{test_id}/evidence` de una prueba documental devuelve solo el requerimiento de **esa prueba en ese control**, y su `shared_with` va vacío. Para las demás pruebas manuales sigue D85.

**Por qué.** Una prueba documental es genérica (`T-DOC-001`: «¿la política existe, está aprobada y vigente?») pero evalúa un objeto distinto en cada control: la política de contraseñas en uno, la de retención de datos en otro. Validar una no valida la otra. RN-13 (un resultado por prueba × servicio × período × versión) tiene sentido para lo que mide la sonda sobre la misma configuración, no para un documento distinto por control. Y el cliente necesita ver con claridad qué sube para qué prueba: leer la prueba, subir su documento, y que el consultor lo revise. El motor ya implementaba la agregación por evidencias (RN-04); solo faltaba que las pruebas documentales la usaran y que la evidencia supiera a qué prueba sirve.

**Lo que no cambia.** D84 (la empresa solo aporta; consultor y auditor revisan, cada uno la suya; el estado que consume el motor sale de la revisión del consultor), D85 para las pruebas **no documentales** y las técnicas, la IA que sugiere y nunca decide (el módulo que diga «esto no es lo que pide la prueba» llegará después), y la evidencia válida dentro del período (C1).

**Es una desviación de RN-13 y del punto 1 de D85 para lo documental, decidida por desarrollo con autorización del responsable de producto (2026-10-22).** Se informa al comité; ver `DT-76`.

**Qué cambia.** `modelo/07-cumplimiento.md` (§7.3), `modelo/03-catalogo-maestro.md`, `modelo/09-calculo-cumplimiento.md`, `contracts/cumplimiento/evidencia.md`, `contracts/cumplimiento/veredictos.md`, `P25` (cerrada), `DT-71` (la parte documental) y `DT-76` (nueva). Migración: `evidence_reviews` (que el modelo ya describía y nunca se creó) y `test_id` en `evidence_requirements` y `control_evidence_templates`.

**Fuente:** Carlos Castaño, 2026-10-22 (responsable de producto, con autorización para mover el Backend y la base de datos).

---

## D121 · El veredicto manual se registra y se revisa en dos niveles, como la evidencia (2026-11-17; Héctor Ríos; *concreta D102*)

> **Reemplazada por D132 (2026-11-22).** La aprobación en dos niveles pasa al control completo: primero el responsable y la final, el `admin_empresa`.

**Decisión.**
1. **Registrar:** el ejecutor, el dueño o el `admin_empresa` registran el veredicto de una prueba manual no documental (`POST …/verdicts`). Nace `pending` y no cuenta.
2. **Revisar:** el dueño, si no lo registró él, y el `admin_empresa` lo aprueban o lo rechazan (`PUT /v1/verdicts/{id}/review`). Hay una revisión por rol y veredicto, y la nota es obligatoria al rechazar.
3. **Estado combinado:** algún rechazo → `rejected`; al menos una aprobación sin rechazos → `approved` (cuenta); sin revisión → `pending`. Decide el último veredicto registrado del test en el servicio.
4. **El `admin_empresa`** cuenta su propia aprobación: lo que registra nace aprobado. `P34` sigue abierta y el auditor es el contrapeso.
5. **Tablas nuevas** `test_verdicts` y `test_verdict_reviews` (modelo §7.4b). Las evaluaciones manuales que ya existían se migran como veredictos aprobados.

**Por qué.** D102 pide el mismo flujo de dos niveles para la evidencia y para el veredicto, pero el contrato del veredicto estaba «por definir». Esto lo define siguiendo el patrón que ya existe para la evidencia.

**Qué cambia.** `contracts/cumplimiento/veredictos.md`, `contracts/enums/cumplimiento.md` (`verdict_state`, `verdict_review_decision`), `datos/modelo/07-cumplimiento.md` §7.4b y el Backend en MD-194.

**Fuente:** Héctor Ríos (Rod), 2026-11-17, al planificar MD-194. Eligió «propuesta + revisión» y que el `admin_empresa` cuente su propia aprobación.
