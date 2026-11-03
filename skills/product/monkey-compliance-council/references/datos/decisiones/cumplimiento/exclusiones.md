# Decisiones — Cumplimiento · Exclusiones

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/exclusiones/`](../../../arquitectura/cumplimiento/exclusiones/README.md). Índice del módulo: [`README.md`](README.md).

## D74 · Exclusiones de activos y controles vencidos (decisiones 3 y 7 del Excel, `P22`)

**Decisión.**
1. **Exclusión de un activo** (decisión 3 de la hoja del comité): la **propone el consultor**, la **aprueba la empresa** y **vence con el período de evaluación** (A3) *(D78: quién propone y quién aprueba se invirtió)*. La justificación escrita es obligatoria (`exclusions.justification`); queda en el rastro. No se pide un documento adjunto
   en el MVP.
2. **Control vencido** (decisión 7): una categoría o un marco con controles `VENCIDO` se reporta **`NO CUMPLE`**, como dice el comité. Es un **parámetro**: puede cambiarse sin tocar el código.

**Por qué.** (1) ya estaba decidido en A3 y D68 solo lo extendió a los activos; (2) es lo que el comité escribió y es lo más estricto.

**Cierra** las decisiones 3 y 7 de la hoja del comité (`P22`). Desbloquea la política de MD-144.

**Fuente:** responsable de producto, 2026-10-10; A3, D68 (REQ-008).

---

---

---

## D78 · Quién propone y quién aprueba una exclusión (2026-10-13, reemplaza en parte a A3 y a D74)

> **Reemplazada por D96 (2026-10-27).** El `admin_empresa` propone y decide la exclusión en un solo acto: nace aprobada, con justificación, vigencia y quién la aprobó (REQ-008 del Excel).

**Decisión.** La exclusión de un activo, de un test o de un check **la propone la empresa** (`admin_empresa`) y **la aprueba el consultor**. Sigue exigiendo justificación, aprobador y vigencia hasta el fin del
período evaluado, y queda en el rastro. Todo lo demás de A3 y D74 se mantiene.

**Por qué.** Los activos son infraestructura de la empresa: ella sabe qué existe y qué está fuera del alcance, y el consultor no tiene cómo saberlo. El consultor aprueba como control independiente: comprueba
que la justificación tenga sentido y que no se esté sacando lo que falla. Es el mismo criterio que ya rige para los controles (D65: la empresa propone y el consultor decide, `05-usuarios.md`). El Excel del comité
solo pregunta «quién autoriza» (decisión 3) y no fija quién propone, así que A3 era una decisión nuestra y no del comité.

**Qué cambia.** Matriz de permisos (§5.5), `exclusions` (§7), §9, D64 y el glosario; el sprint (MD-144). Abre `P24`.

**Fuente:** responsable de producto, 2026-10-13; A3, D64, D65, D74.

---

---

## D83 · Sin consultor, la exclusión espera; y la exclusión lleva su servicio (2026-10-16, cierra P24)

> **Reemplazada por D96 (2026-10-27).** Ya no hay un consultor que apruebe, así que una exclusión no espera a nadie: `awaiting_consultant` y la caja de contacto desaparecen (cierra `P28` por obsoleta).

**Decisión.**
1. Mientras la empresa **no tenga un consultor activo** (sin asignar, suspendido o retirado), una exclusión propuesta **queda pendiente y el activo sigue contando**. Ningún otro rol la aprueba.
2. La pantalla le dice al administrador de la empresa que, para que la exclusión se apruebe, **hay que asignarle un consultor**, y le ofrece una **casilla para ponerse en contacto con el equipo de mercadeo, o con quien esté a cargo de ese trámite**, para gestionarlo. La API lo señala con `awaiting_consultant` en cada exclusión pendiente; el texto y a quién se contacta son de la pantalla.
3. `exclusions` guarda su `service_id`: un activo es de la organización y puede servir a varios servicios, así que una exclusión es de un activo **en un test de un servicio**, no del activo en general.

**Por qué.** Una exclusión sin quien la apruebe no puede cambiar el resultado: dejarla pasar sin un control independiente sería sacar de la medición lo que falla (D78). El consultor lo asigna `admin_monkey`, así que el camino de la empresa es pedírselo a Monkey. El `service_id` ya lo implicaba el contrato (`GET /v1/services/{id}/exclusions`) y D68 (el test se mide por servicio), pero el ER no lo traía.

**Lo que no cambia.** Quién propone y quién aprueba (D78); que una exclusión sin aprobar no cambia nada; que el veredicto de la sonda no se sobrescribe.

**Qué cambia.** `modelo/07-cumplimiento.md` (la tabla `exclusions`), `contracts/cumplimiento/exclusiones.md` (`awaiting_consultant`) y la migración `20261016130000_exclusions_and_service_period`. **Queda a cargo de la pantalla** de exclusiones (MD-169) el aviso y la casilla de contacto: a quién se contacta y cómo es el pendiente `P28`.

**Fuente:** responsable de producto, 2026-10-16; D78.

---
