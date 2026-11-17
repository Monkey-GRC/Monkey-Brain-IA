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
| [`riesgos.md`](riesgos.md) | Riesgos y causas, vínculos, evaluación 5×5 y tratamiento |
| [`resumen.md`](resumen.md) | El resumen del servicio por marco y categoría |
| [`evidencia.md`](evidencia.md) | Evidencias: subir con huella y versión, descargar con enlace firmado, **validar o rechazar** |
| [`veredictos.md`](veredictos.md) | Los tests de un control, qué falló y cómo corregirlo, y el veredicto de una prueba manual |
| [`observaciones.md`](observaciones.md) | Lo que escribe el auditor y cómo lo responde la empresa |
| [`exclusiones.md`](exclusiones.md) | Sacar un activo de un test, con vigencia |

| | |
|---|---|
| **Estado** | **ACORDADO**, reescrito por D96 (2026-10-27) y ajustado por D102 (2026-11-03: dueño, ejecutor y revisión en dos niveles; por construir en el sprint 3) |
| **App** | Monkey Platform |
| **Entidades** | `evaluations`, `evidence_submissions`, `evidence_reviews`, `audit_observations`, `exclusions` (`modelo-datos.md` §7.3 a §7.6) |
| **Tickets** | MD-144, MD-154, MD-155, MD-127 · sprint 3: MD-193, MD-194 |

Construido: exclusiones MD-144, revisión de la evidencia MD-127, veredicto MD-155, observaciones del auditor MD-154; el Backend ya quedó ajustado a este texto salvo lo que lista «Estado de implementación». Ver `conventions.md` (sección «Cumplimiento») y `enums.md`.

**Qué es.** El **`admin_empresa` es el experto en compliance** (D96): valida la evidencia, da el veredicto de las pruebas manuales y decide las exclusiones. El **`responsable`** (dueño del control) y su **`delegado`** (ejecutor) suben la evidencia y reparan lo suyo (D102); el responsable además revisa lo que suben sus delegados, y el **`auditor`** revisa y escribe observaciones que la empresa debe atender; no califica por ahora. 
Los cambios de controles, riesgos y causas están en `contracts/cumplimiento/controles.md` y `contracts/cumplimiento/riesgos.md`; el resumen del servicio, en `contracts/cumplimiento/resumen.md`; y quién es responsable de qué, en `contracts/gestion-usuarios.md`.

## Quién puede qué

| Acción | `admin_empresa` | `responsable` y `delegado` | `auditor` |
|---|---|---|---|
| Ver los tests de un control (vista técnica, D81) | ✓ | `403` | ✓ |
| Ver qué falló y cómo corregirlo en una prueba de nube (hallazgos) | ✓ | ✓ solo la suya | ✓ |
| Dar el veredicto de un test manual | ✓ | `403` | `403` |
| Revisar (validar o rechazar) una evidencia | ✓ cualquiera | ✓ **solo el `responsable` dueño**, lo que no subió él (`delegado`: `403`) | `403` |
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
| 422 | `VALIDATION_FAILED` | Campos: `required`, `enum.invalid`, `closure_reason.required` (veredicto con observaciones abiertas), `note.required` (rechazar una evidencia sin `note`), `control.mismatch` (la evidencia no es del control), `body_or_status.required` / `body_or_status.exclusive` (un PATCH de observación) |

## Estado de implementación (común)

**Construido (2026-10-28, B66): validación, veredicto y exclusiones en el `admin_empresa`.** El Backend ya hace lo que dice este contrato en:

- **Pruebas:** `revision-evidencia`, `veredictos`, `eventos-estado`, `exclusiones` y `evidencias` en `Backend/test/cumplimiento/`.

**Construido (MD-193, 2026-11-17): cada persona ve solo lo suyo (D102, SEG-66).** El `responsable` y el `delegado` ven y tocan solo los controles de los que son dueño o ejecutor activo, y lo que cuelga de ellos: pruebas, evidencia, riesgos y causas, observaciones, hallazgos de nube y servicios. El resumen es el de sus controles (D118). Sin controles, las listas llegan vacías. Lo ajeno de su empresa es `403`; lo de otra empresa, `404`. La regla vive en `compliance/domain/controls/control-access.ts`. Se retiró el reparto por dimensión de B67. Las **observaciones (MD-154)** quedaron construidas el 2026-10-29 (abajo).

## Preguntas abiertas (comunes)

- **`P3` está cerrada (D102):** el comité no entregará el Excel por pantalla; manda la matriz de `modelo/05-usuarios.md` §5.5.
