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

---

## D132 · Gestión y aprobación del cumplimiento del control: aprueba primero el responsable y la aprobación final es del administrador (2026-11-22; reemplaza D121 y el punto 8 de D102)

**Decisión** (`MAP CALOR`, sección 14; `Modelo de Gestión usuarios`, Tabla 2):

1. **Estados de gestión del control**: Incumplimiento (estado inicial, ventana vencida o falla de un control automático) → En gestión → Cumple – por aprobar (Monkey calcula que el 100% de los requisitos cumple) → Aprobado por el responsable → **Cumplimiento aprobado**, el único que cuenta como cumplido. Devuelto (con motivo) vuelve a En gestión.
2. **Quién hace qué** (G-01 a G-05): el `admin_empresa` asigna un responsable a cada control (el rol sugerido es solo una guía); el responsable puede delegarlo en un delegado de su equipo y sigue respondiendo por él; la evidencia la carga el delegado o, sin delegado, el responsable. Aprueba primero el responsable y después el `admin_empresa`. Si el `admin_empresa` es el responsable del control, su aprobación es la final.
3. **La aprobación es del control, no de cada evidencia.** La matriz de la VF18 ya no tiene «Aprobar evidencia»: una evidencia manual cuenta si la cargó el delegado o el responsable, está vigente y no fue devuelta (§3.1 del libro). Un rechazo del responsable o del administrador devuelve el control con motivo, avisa al delegado y al responsable, y marca como devuelta la evidencia que lo causó.
4. **Controles automáticos** (G-07): si un check Directo pasa de PASS a FAIL o cambia la parametrización evaluada, el control vuelve a Incumplimiento y se alerta; con la corrección y un nuevo PASS vuelve a «Cumple – por aprobar».
5. Cada delegación, carga, aprobación, rechazo y alerta queda en el registro de auditoría (G-09).

**Por qué.** Es el modelo del libro: separa lo que Monkey calcula (el nivel, D130) de lo que una persona aprueba. La IA nunca aprueba (regla 3).

**Qué cambia.** §7 (estados de gestión y aprobaciones por control), `contracts/cumplimiento/controles.md`, `evidencia.md` y `veredictos.md`. **Reemplaza** D121 (el veredicto revisado en dos niveles) y el punto 8 de D102 (la revisión por evidencia); con D133, **reemplaza D88**. **Cierra `P34`**: que el administrador dueño de un control dé la aprobación final de lo suyo es la regla (G-05). El resultado de una prueba operativa o técnica manual lo registra el responsable (D140).

**Fuente:** comité funcional, VF18 (`MAP CALOR`, secciones 3.1, 6 y 14; `Modelo de Gestión usuarios`, Tabla 2), 2026-11-22.

---
