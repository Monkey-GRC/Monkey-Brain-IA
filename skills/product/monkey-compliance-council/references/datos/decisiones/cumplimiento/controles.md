# Decisiones — Cumplimiento · Controles

Por qué este componente es como es. Lo vigente está en [`arquitectura/cumplimiento/controles/`](../../../arquitectura/cumplimiento/controles/README.md). Índice del módulo: [`README.md`](README.md).

## D65 · Controles propios y cambios de controles con aprobación del consultor (cierra P8) (2026-10-09)

> **Reemplazada por D96 (2026-10-27).** El `admin_empresa` crea, edita y da de baja controles propios y cambios de controles **directamente**, con advertencia y confirmación; ya no se propone ni se aprueba. Se conserva: el control propio es solo documental, va en una categoría que elige la empresa y cuenta para el porcentaje.

**Decisión.**

- El cliente puede **proponer** crear un control propio, darlo de baja y editar las dimensiones o la interpretación de cualquier control suyo. **Decide el consultor.**
- Un control propio es **solo documental** (dimensión `policy`, tipo `manual`) y el cliente lo **ubica en una categoría** (`client_controls.trust_criterion`).
- **Cuenta para el porcentaje** de su categoría y del marco, incluso mientras está pendiente de aprobación; si se rechaza, se da de baja y deja de contar. Las bajas y las ediciones
  no se aplican hasta que se aprueban.
- No tiene punto de enfoque, así que **no cierra ningún requisito**: solo aporta al porcentaje.

**Por qué.** El cliente conoce su operación y puede tener controles que el catálogo no trae, pero cambiar lo que se mide cambia el porcentaje, así que lo valida quien prepara la auditoría.
**Fuente:** responsable de producto, 2026-10-09; `modelo-datos.md` §7.1.

---

## D119 · El historial de un control dado de baja se sigue leyendo (2026-11-17; Héctor Ríos; *amplía a evidencia y veredictos lo que ya decía observaciones*)

**Decisión.**
1. Un control dado de baja deja de verse en la lista y en su detalle (`404`), y no admite cambios nuevos (`409 CONTROL_RETIRED`: subir evidencia, abrir observaciones, editarlo).
2. **Su historial se sigue leyendo:** las evidencias entregadas (lista y descarga), los veredictos y las observaciones. Rige la misma regla de alcance (D102): un `responsable` o `delegado` solo lo lee si es dueño o ejecutor activo del control.

**Por qué.** Lo que se entregó y se decidió es rastro de auditoría. Esconderlo al dar de baja el control le quitaría al auditor parte de la historia. `contracts/cumplimiento/observaciones.md` ya lo decía para las observaciones; aquí se extiende a la evidencia y los veredictos.

**Qué cambia.** `contracts/cumplimiento/controles.md`, `evidencia.md` y `veredictos.md` (una línea cada uno), y una prueba e2e en MD-193 (`test/cumplimiento/control-baja.e2e-spec.ts`). Los criterios del comité sobre las observaciones de controles dados de baja siguen en `P37`.

**Fuente:** Héctor Ríos (Rod), 2026-11-17, al cerrar MD-193; eligió «Historial legible».
