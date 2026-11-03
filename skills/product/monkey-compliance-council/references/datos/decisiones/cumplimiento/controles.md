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
