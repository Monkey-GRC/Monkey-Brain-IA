---
name: monkey-docs
description: >-
  Escribe y mantiene las historias de usuario (04-historias.md) y los casos de uso (05-casos-de-uso.md con su diagrama UML
  en PlantUML) de un módulo de Monkey, los exporta a PDF para el comité o un auditor y los sincroniza con Jira (épica por
  módulo). Úsala al documentar un módulo o al cambiar lo que hace. No usar para decidir qué se construye ni para contratos.
---

# Historias, casos de uso y su entrega

Cada módulo de `references/arquitectura/<módulo>/` lleva `04-historias.md` y `05-casos-de-uso.md` (convención de
`arquitectura/README.md`). **La fuente es el cerebro** (Markdown + PlantUML, versionado y vigilado por `docs-guardian`); el
PDF es solo la entrega, y Jira el lugar donde se planifica. El piloto y la referencia de formato es
[`autenticacion/`](../../product/monkey-compliance-council/references/arquitectura/autenticacion/04-historias.md) (MD-246).

## 1. De dónde sale el contenido (nada se inventa)

Lee, en este orden: el README del módulo, `contracts/<módulo>.md`, sus decisiones (`datos/decisiones/<módulo>.md`), su
modelo (`02-modelo.md`), sus flujos (`03-flujos.md`) y sus `SEG-n`. Una historia o un caso que dependa de una `P-n` abierta
se escribe con estado ⚪ y cita la `P-n`; **no se resuelve** (regla 5 de `CLAUDE.md`). Si algo no está en ninguna fuente,
no va.

**Solo lo decidido.** Una historia o un caso sale de una decisión (`D-n`), del contrato, del modelo o de un `SEG-n`;
**nunca de una mejora** (`06-mejoras.md`, `M-n`, `I-n`) ni de una propuesta, aunque tenga ticket: hasta que se decida no
es historia, y tampoco se cita como fuente de un criterio (Rod, 2026-11-18).

## 2. `04-historias.md`

- Encabezado «Responde: …», los roles (D96) y la leyenda de estado: ✅ construida · 🟡 parcial · ⚪ por construir (el
  estado sale de la sección «Estado de implementación» del contrato, no de memoria).
- Tabla **Resumen**: `ID · Historia · Rol · Estado · Reglas`.
- Una sección por historia, `### HU-<MÓD>-nn · <título>`: **Como** <rol>, **quiero** <capacidad> **para** <beneficio>, y
  sus criterios de aceptación en viñetas **verificables** (Dado/cuando/entonces o enunciado comprobable), cada uno con la
  regla que lo fija (`D-n`, `SEG-n`, código de error del contrato).
- `<MÓD>`: un código corto y estable por módulo (AUTH, USR, ROL, EMP, CAT, ONB, CT, CUM, TRZ, TEN, PLT, INT, NOT).

## 3. `05-casos-de-uso.md` y su UML

- Encabezado, la imagen del diagrama (`05-casos-de-uso.svg`) y el enlace a su fuente `05-casos-de-uso.puml`.
- Tabla **Resumen**: `ID · Caso · Actor principal · Historias`.
- Por caso, `### CU-<MÓD>-nn · <título>`: tabla `Actor · Precondición · Postcondición`, **Flujo principal** numerado y
  **Flujos alternos** (`2a.`, `3b.`) con el error exacto del contrato.
- **Diagrama UML de casos de uso en PlantUML** (`05-casos-de-uso.puml`, al lado): actores (con generalización cuando
  comparten casos), el límite del sistema (`rectangle "Monkey · <Módulo>"`), un óvalo por `CU-…`, relaciones
  `<<include>>` y `<<extend>>` con su condición. Copia la cabecera y los `skinparam` del de Autenticación
  (`!pragma layout smetana`, sin Graphviz). Genera el SVG y commitea **los dos**:

```bash
skills/process/monkey-docs/scripts/render-uml.sh                 # todos los .puml de arquitectura/
skills/process/monkey-docs/scripts/render-uml.sh ruta/al/05-casos-de-uso.puml
```

`check-doc-drift.py` falla si un `.puml` no tiene su `.svg`.

## 4. Enlazarlo

En el README del módulo (sección «Contenido») y en la fila del módulo de `arquitectura/README.md`
(enlaces «historias» y «casos de uso» a los dos archivos). Después, `check-brain.py` y
`check-doc-drift.py` en OK.

## 5. Entrega en PDF (cuando la pidan el comité o un auditor)

```bash
skills/process/monkey-docs/scripts/export-pdf.sh <módulo>        # exports/<módulo>-historias-y-casos-de-uso-<fecha>.pdf
skills/process/monkey-docs/scripts/export-pdf.sh --all
```

Portada azul marino con el logo de Monkey, encabezado con logo y pie con «Página n de m», tablas con cabecera de
marca, el estado como etiqueta de color (Construida, Parcial, Por construir) y el diagrama. `build-pdf-html.py` arma la
presentación y **limpia los atajos de escritura** que en un entregable se ven raros (→ y ⇒ pasan a «:», la raya — a coma o
guion, – de rango a «a», … a «...»); también quita la nota «Jira:» y deja los enlaces internos como texto. Los logos
están en `assets/`. Cambiar el aspecto del PDF es tocar ese script, nunca el Markdown. `exports/` no se versiona: el PDF se regenera desde el cerebro.

## 6. Jira: una épica por módulo

Una **épica** «Historias · <Módulo>» y una **historia** de Jira por cada `HU-…`, con el ID al inicio del resumen
(`HU-AUTH-04 · Iniciar sesión con contraseña y código`), el texto «Como… quiero… para…», los criterios y el enlace al
archivo del cerebro. **Claude mueve a «Listo» (transición 31) cada historia ✅ al crearla, y la épica cuando todas sus
historias lo están** (autorizado por Rod el 2026-11-18, solo para estas historias de documentación; los demás tickets los
sigue moviendo Rod). Las 🟡 y ⚪ quedan en «Por hacer». El cerebro manda: si cambia una historia, se actualiza también su
issue.
