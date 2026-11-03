---
name: monkey-ui-copy
description: >-
  Reglas para cualquier texto, pantalla, correo, notificación o reporte que vea un usuario final de Monkey (lenguaje GRC
  con códigos, estado y porcentaje juntos, plantilla de 7 campos, vista técnica por rol, qué nunca nombrar). Úsala al
  escribir copy o diseñar una vista de cumplimiento. No usar para código interno, logs ni documentación del cerebro.
---

# Texto y pantallas para el usuario final

La fuente es `references/producto/philosophy.md`; esta skill es la lista corta para aplicar mientras se escribe.
La regla nació de un error concreto (ver «Origen» en `philosophy.md`): una pantalla de Cumplimiento salió con porcentajes
desnudos y códigos técnicos sin explicar.

## 1. Lenguaje de GRC, con códigos y con explicación

- Usa el vocabulario del dominio: **controles, riesgos, causas, evidencias, requisitos, marcos, tratamiento, riesgo residual**.
- **Muestra siempre el código** (`CC6.1`, `IAC-12`). Nunca un eufemismo que oculte el término correcto («acción de
  protección», «lo que podría salir mal»).
- Junto al código va qué falla, qué impacto tiene y qué hacer. Para un hallazgo, la **plantilla de 7 campos**: qué ocurrió ·
  por qué importa · cómo solucionarlo · quién · cuánto tiempo · qué evidencia · qué impacto.

## 2. Estado y porcentaje, siempre juntos

- Estado cualitativo: **Preparado** (100 %), **Casi listo** (80 % o más), **Requiere trabajo** (menos), **Sin medir**.
- Se muestra a la vez que el **porcentaje de avance**, y con la **cobertura al lado** («de lo medido» y cuánto se midió).
- Nunca un porcentaje solo. Nunca uno de «toda la empresa»: la unidad es **servicio × marco**.
- El porcentaje **informa, no decide**: el estado se calcula aparte (`arquitectura/cumplimiento/motor/`).

## 3. Quién ve qué

- **Vista técnica** (estados del motor, pruebas, puntos de enfoque, matrices): `auditor` y `admin_empresa` (D81, D96), mientras
  los permisos por pantalla sigan abiertos (`P3`). No es un modo ni un botón: es lo que ese rol ve.
- El `funcional` ve la vista de negocio, que ya usa el vocabulario y los códigos del dominio.
- El `admin_empresa` es el experto en compliance de su empresa y quien valida; el `funcional` ejecuta lo de su dimensión;
  el `auditor` revisa y no califica por ahora (D96).

## 4. Lo que el texto nunca hace

- **No nombra al proveedor** de la sonda ni del motor de nube. Se dice «sonda», «capacidad automática» o «evaluación
  automática». Aplica a pantallas, correos, notificaciones, reportes y texto generado por IA. Los hooks de `.claude/` lo
  comprueban en `Frontend-Platform`, `contracts/`, el i18n del Backend y los correos.
- **La IA no certifica cumplimiento.** No presenta una inferencia como hecho verificado sin mostrar la evidencia, y
  etiqueta siempre lo que ella generó.

## 5. Antes de dar el texto por bueno

Pregúntate: ¿hay un código visible?, ¿hay estado **y** porcentaje **y** cobertura?, ¿explica qué hacer?, ¿nombra algún
proveedor? Si el texto es un mensaje de error o una opción de lista, su traducción vive en i18n (nunca en el componente).
