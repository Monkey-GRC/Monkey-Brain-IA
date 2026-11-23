# `assets/` — documentos del comité

Aquí viven los documentos que entrega el **comité funcional**. Son la fuente de verdad del proyecto
(`CLAUDE.md`, «Precedencia»): los `.md` de `references/` solo los transcriben. Los binarios (`.xlsx`,
`.docx`, `.pptx`) y las salidas de escaneos **no se versionan** (`.gitignore`): pesan y algunos traen datos
de clientes. Viven en la carpeta compartida del equipo; este archivo sí se versiona y dice qué es cada uno.

| Archivo | Qué es | Estado |
|---|---|---|
| `TSC INTERGRAL SOC 2 DETALLADO VF18_DEV.xlsx` | **La fuente maestra**: el catálogo v2 y el modelo de evaluación (hoja `MAP CALOR`), entregado el 2026-11-22. Empieza por las hojas `00_LEEME` y `01_DESARROLLO` | Vigente (D128) |
| `TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx` · `…VF.xlsx` | El catálogo v1 | Reemplazados por la VF18: se retiran de la carpeta |
| `Imagen pegada.png` | Captura de referencia | Versionada |
| `soc2/` · `*.html` | Salidas crudas de escaneos de una cuenta real | No se versionan: son datos del cliente |

Qué define cada hoja de la fuente maestra y dónde quedó transcrita está en
[`modelo/00-fuentes.md`](../skills/product/monkey-compliance-council/references/datos/modelo/00-fuentes.md).
`manifest.json` (`sources`) apunta al mismo archivo.
