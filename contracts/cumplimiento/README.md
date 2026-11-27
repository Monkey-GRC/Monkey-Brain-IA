---
id: contracts-compliance
name: Contratos de Cumplimiento
description: Índice de los contratos de Cumplimiento y lo que comparten: quién puede qué sobre pruebas, evidencia, observaciones y exclusiones.
type: contract
---

# Contratos de Cumplimiento

> Formato de cada contrato: [`../README.md`](../README.md#formato-de-un-contrato).

## Índice

| Contrato | Qué cubre |
|---|---|
| [`controles.md`](controles.md) | Controles: listar, ver, crear uno propio, editar y dar de baja |
| [`aprobacion.md`](aprobacion.md) | Estado de gestión del control, aprobación del responsable y final, devolución y resultado de una prueba manual (MD-504); **MD-529:** corrección del nivel (R5), plan de remediación, «No aplica», ocurrencias y declaración trimestral, historial de gestión y `allowed_actions` |
| [`gestion.md`](gestion.md) | **MD-529:** corrección del nivel (R5), plan de remediación, «No aplica», ocurrencias y declaración trimestral, historial de gestión y `allowed_actions` (continuación de `aprobacion.md`) |
| [`riesgos.md`](riesgos.md) | Riesgos y causas, vínculos, evaluación 5×5 y tratamiento |
| [`resumen.md`](resumen.md) | El resumen del servicio por marco y categoría |
| [`evidencia.md`](evidencia.md) | Evidencias: subir con huella y versión, descargar con enlace firmado, subir, listar y descargar (la aprobación es del control, `aprobacion.md`) |
| [`veredictos.md`](veredictos.md) | Los tests de un control y qué falló y cómo corregirlo (el veredicto se retiró en MD-504) |
| [`observaciones.md`](observaciones.md) | Lo que escribe el auditor y cómo lo responde la empresa |
| [`exclusiones.md`](exclusiones.md) | Sacar un activo de un test, con vigencia |

| | |
|---|---|
| **Estado** | **ACORDADO**, reescrito por D96 (2026-10-27) y ajustado por D102 (2026-11-03: dueño, ejecutor y revisión en dos niveles; por construir en el sprint 3) |
| **App** | Monkey Platform |
| **Entidades** | `evaluations`, `evidence_submissions`, `control_approvals`, `manual_test_results`, `audit_observations`, `exclusions` (`modelo-datos.md` §7.3 a §7.6) |
| **Tickets** | MD-144, MD-154, MD-155, MD-127 · sprint 3: MD-193, MD-194 |

Construido: exclusiones MD-144, aprobación del control MD-504 (reemplazó la revisión de la evidencia MD-127 y el veredicto MD-155), observaciones del auditor MD-154; el Backend ya quedó ajustado a este texto salvo lo que lista «Estado de implementación». Ver `conventions.md` (sección «Cumplimiento») y `enums.md`.

**Qué es.** El **`admin_empresa` es el experto en compliance** (D96): da la aprobación final del control (D132) y decide las exclusiones. El **`responsable`** (dueño del control) y su **`delegado`** (ejecutor) suben la evidencia y reparan lo suyo (D102); el responsable además registra el resultado de las pruebas manuales y da la primera aprobación del control, y el **`auditor`** revisa y escribe observaciones que la empresa debe atender; no califica por ahora. 
Los cambios de controles, riesgos y causas están en `contracts/cumplimiento/controles.md` y `contracts/cumplimiento/riesgos.md`; el resumen del servicio, en `contracts/cumplimiento/resumen.md`; y quién es responsable de qué, en `contracts/gestion-usuarios.md`.

## Quién puede qué

| Acción | `admin_empresa` | `responsable` y `delegado` | `auditor` |
|---|---|---|---|
| Ver los tests de un control (vista técnica, D81) | ✓ | `403` | ✓ |
| Ver qué falló y cómo corregirlo en una prueba de nube (hallazgos) | ✓ | ✓ solo la suya | ✓ |
| Registrar el resultado de una prueba manual (`aprobacion.md`) | ✓ si el control no tiene responsable o es el responsable | ✓ solo el `responsable` dueño (`delegado`: `403`) | `403` |
| Aprobar o devolver el control (`aprobacion.md`) | ✓ la aprobación final | ✓ solo el `responsable` dueño, la primera (`delegado`: `403`) | `403` |
| Proponer una corrección de nivel, un plan de remediación o un «No aplica»; declarar «sin ocurrencias» (MD-529) | ✓ solo si lleva el control (directo) | ✓ solo el `responsable` dueño (`delegado`: `403`) | `403` |
| Decidir esas propuestas (MD-529) | ✓ | `403` | `403` |
| Registrar una ocurrencia «cuando sea requerido» y subir su evidencia (MD-529) | ✓ | ✓ dueño y ejecutor | `403` |
| Ver el historial de gestión de un control (MD-529) | ✓ todos | ✓ solo sus controles | ✓ todos |
| Escribir, editar y cerrar una observación | `403` | `403` | ✓ las suyas |
| Ver las observaciones | todas | **las de sus controles** (dueño o ejecutor) | todas |
| Responder una observación | ✓ | ✓ solo de un control suyo | `403` |
| Decidir una exclusión (la propone y la aprueba en un acto) | ✓ | `403` | `403` |
| Ver las exclusiones | ✓ | `403` | ✓ |

## Errores comunes

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no puede; cerrar una observación que no escribió; el control no es del `responsable` o `delegado` que lo pide |
| 404 | `NOT_FOUND` | El control, el test, el activo, la observación o la exclusión no existen para esta empresa |
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `reason.required` y `result.invalid` (`aprobacion.md`), `control.mismatch` (la evidencia no es del control), `body_or_status.required` / `body_or_status.exclusive` (un PATCH de observación) |

## Estado de implementación (común)

**Construido (2026-10-28, B66): validación, veredicto y exclusiones en el `admin_empresa`.** *(MD-504, 2026-11-25: la validación de la evidencia y el veredicto se retiraron; ver `aprobacion.md`.)* El Backend ya hace lo que dice este contrato en:

- **Pruebas:** `aprobacion-control`, `eventos-estado`, `exclusiones` y `evidencias` en `Backend/test/cumplimiento/`.

**Construido (MD-193, 2026-11-17): cada persona ve solo lo suyo (D102, SEG-66).** El `responsable` y el `delegado` ven y tocan solo los controles de los que son dueño o ejecutor activo, y lo que cuelga de ellos: pruebas, evidencia, riesgos y causas, observaciones, hallazgos de nube y servicios. El resumen es el de sus controles (D118). Sin controles, las listas llegan vacías. Lo ajeno de su empresa es `403`; lo de otra empresa, `404`. La regla vive en `compliance/domain/controls/control-access.ts`. Se retiró el reparto por dimensión de B67. Las **observaciones (MD-154)** quedaron construidas el 2026-10-29 (abajo).

## Preguntas abiertas (comunes)

- **`P3` está cerrada (D102):** el comité no entregará el Excel por pantalla; manda la matriz de `modelo/05-usuarios.md` §5.5.
