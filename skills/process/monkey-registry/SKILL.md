---
name: monkey-registry
description: >-
  Da de alta o cierra un registro del cerebro de Monkey: una decisión (D), un pendiente del comité (P), una deuda
  técnica (DT) o un requisito de seguridad (SEG), con su siguiente ID libre, su ficha en el archivo del módulo y su fila
  de tablero. Úsala cuando un cambio decide algo, usa un atajo, abre una pregunta o crea un requisito. No usar para
  editar texto de un registro ya existente sin cambiar su estado.
argument-hint: "D|P|DT|SEG <módulo>"
---

# Alta y cierre de registros

Cuatro registros, un eje: el **módulo** (`STANDARD.md` §2b). Un ítem que aplica en varias partes vive **una vez**, en el módulo
que posee la capacidad. Los IDs no se reutilizan ni se renumeran.

## 1. Siguiente ID

```bash
python3 skills/process/monkey-registry/scripts/next-id.py DT      # D | P | DT | SEG
```

Busca el máximo en **todo** el cerebro, menciones incluidas, porque un `DT-n` cerrado se borra de su ficha y su número no se
reutiliza. Si el número que sale te parece alto, es por una mención reservada (p. ej. un `D-n` que otro pendiente dice
que «nacerá»): respétalo.

## 2. Dónde va cada uno

| Tipo | Ficha | Tablero |
|---|---|---|
| `D-n` decisión | `references/datos/decisiones/<módulo>.md` (o `<módulo>/<componente>.md`) | Fila en `datos/decisiones/README.md` |
| `P-n` pendiente | `references/datos/pendientes/<módulo>.md` | Fila en `datos/pendientes/README.md` |
| `DT-n` deuda | `references/deuda-tecnica/<módulo>.md` | Fila en `deuda-tecnica/README.md`, en su severidad |
| `SEG-n` requisito | Fila en `references/seguridad/<módulo>.md` | Resumen y «Lo que falta» en `seguridad/README.md` |

Si el módulo no tiene archivo en ese registro, se crea. Si no es de un módulo de producto (CI, despliegue, respaldos) va a `entrega.md`.

## 3. Formato de la ficha

- **Decisión:** `## D<n> · <título> (<fecha>)` con *Decisión*, *Por qué*, *Qué cambia* y **Fuente (quién y cuándo)**. **Sin fuente no hay decisión.**
- **Pendiente:** `## P<n> · <pregunta>` con *Estado*, la lista de preguntas numeradas y *Qué depende*. Mientras exista, nadie la resuelve por su cuenta.
- **Deuda:** `### DT-<n> · <título>`, severidad (🔴 🟠 🟡) y tres viñetas: **Qué está parchado**, **Por qué**, **Qué lo cierra**.
- **Requisito:** `| **SEG-nn** | estado | requisito | cómo se hace cumplir | verificación | fuente |`. El estado se demuestra con una prueba automática;
  sin ella es 🟡.

## 4. Cerrar

- **Deuda cerrada:** se **borra** su ficha y su fila de tablero, y se deja constancia en el commit o en la decisión que la cierra. El número no vuelve a usarse.
- **Pendiente cerrado:** pasa a decisión `D-n` (con fuente), se borra de `pendientes/` y su fila va a «Cerradas hasta hoy».
- **Requisito cumplido:** cambia el estado y se cita la prueba o el PR; el resumen se actualiza.

## 5. Al terminar

Corre `monkey-closeout` (o `check-brain.py`): comprueba anclajes del tablero, IDs duplicados y enlaces. Después enlaza el
`D/P/DT/SEG` desde el README del módulo si es nuevo en esa lista.
