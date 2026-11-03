---
id: contracts-compliance
name: Contratos de Cumplimiento
description: Índice de los contratos de Cumplimiento y lo que comparten: quién puede qué sobre pruebas, evidencia, observaciones y exclusiones.
type: contract
---

# Contratos de Cumplimiento

| Contrato | Qué cubre |
|---|---|
| [`controles.md`](controles.md) | Controles: listar, ver, crear uno propio, editar y dar de baja |
| [`riesgos.md`](riesgos.md) | Riesgos y causas, vínculos, evaluación 5×5 y tratamiento |
| [`resumen.md`](resumen.md) | El resumen del servicio por marco y categoría |
| [`evidencia.md`](evidencia.md) | Evidencias: subir con huella y versión, descargar con enlace firmado, **validar o rechazar** |
| [`veredictos.md`](veredictos.md) | Los tests de un control, qué falló y cómo corregirlo, y el veredicto de una prueba manual |
| [`observaciones.md`](observaciones.md) | Lo que escribe el auditor y cómo lo responde la empresa |
| [`exclusiones.md`](exclusiones.md) | Sacar un activo de un test, con vigencia |

**Estado: ACORDADO, reescrito por D96 (2026-10-27).** Construido: exclusiones MD-144, revisión de la evidencia MD-127, veredicto MD-155, observaciones del auditor MD-154; el Backend ya quedó ajustado a este texto salvo lo que lista «Estado de implementación». Ver `conventions.md` (sección «Cumplimiento») y `enums.md`. Tickets: MD-144, MD-154, MD-155, MD-127.

**Qué es.** El **`admin_empresa` es el experto en compliance** (D96): valida la evidencia, da el veredicto de las pruebas manuales y decide las exclusiones. El **`funcional`** sube la evidencia y repara lo suyo, y el **`auditor`** revisa y escribe observaciones que la empresa debe atender; no califica por ahora. **Entidades:** `evaluations`, `evidence_submissions`, `evidence_reviews`, `audit_observations`, `exclusions` (`modelo-datos.md` §7.3 a §7.6). **App:** Monkey Platform.
Los cambios de controles, riesgos y causas están en `contracts/cumplimiento/controles.md` y `contracts/cumplimiento/riesgos.md`; el resumen del servicio, en `contracts/cumplimiento/resumen.md`; y quién es responsable de qué, en `contracts/gestion-usuarios.md`.

## Quién puede qué

| Acción | `admin_empresa` | `funcional` | `auditor` |
|---|---|---|---|
| Ver los tests de un control (vista técnica, D81) | ✓ | `403` | ✓ |
| Ver qué falló y cómo corregirlo en una prueba de nube (hallazgos) | ✓ | ✓ solo la suya | ✓ |
| Dar el veredicto de un test manual | ✓ | `403` | `403` |
| Validar o rechazar una evidencia (atributos y revisión) | ✓ | `403` | `403` |
| Escribir, editar y cerrar una observación | `403` | `403` | ✓ las suyas |
| Ver las observaciones | todas | **las de los controles de los que es responsable** | todas |
| Responder una observación | ✓ | ✓ solo de un control suyo | `403` |
| Decidir una exclusión (la propone y la aprueba en un acto) | ✓ | `403` | `403` |
| Ver las exclusiones | ✓ | `403` | ✓ |
## Errores comunes

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; cerrar una observación que no escribió; el `funcional` no es responsable de ese control |
| 404 | `NOT_FOUND` | El control, el test, el activo, la observación o la exclusión no existen para esta empresa |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `closure_reason.required` (veredicto con observaciones abiertas), `note.required` (rechazar una evidencia sin `note`), `control.mismatch` (la evidencia no es del control), `body_or_status.required` / `body_or_status.exclusive` (un PATCH de observación) |

## Estado de implementación (común)

**Construido (2026-10-28, B66): validación, veredicto y exclusiones en el `admin_empresa`.** El Backend ya hace lo que dice este contrato en:

- **Pruebas:** `revision-evidencia`, `veredictos`, `eventos-estado`, `exclusiones` y `evidencias` en `Backend/test/cumplimiento/`.

El **`funcional` ve solo lo suyo** quedó construido el 2026-10-29 (B67, SEG-66; ver `contracts/gestion-usuarios.md`): controles, evidencia, riesgos y hallazgos se filtran por el responsable efectivo de cada dimensión. Las **observaciones (MD-154)** quedaron construidas el 2026-10-29 (abajo).

## Preguntas abiertas (comunes)

- **`P3`**: el detalle por pantalla puede ajustar la tabla de «Quién puede qué».
