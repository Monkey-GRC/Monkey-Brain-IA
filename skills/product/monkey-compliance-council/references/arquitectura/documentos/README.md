# Documentos

Responde: **¿cómo gestiona una empresa sus políticas, procedimientos y demás documentos dentro de Monkey, y cómo eso
prueba los controles?** Cada documento tiene un responsable, versiones, un flujo de aprobación de hasta cinco pasos y la
aceptación del personal al que aplica. De ese flujo sale la **prueba documental** del documento (`T-DOC`), que alimenta a
todos los controles que lo usan.

> **No está construido.** Es un módulo nuevo de la VF18 del comité (D133, RC-09). Su contrato (un archivo nuevo en `contracts/`)
> se escribe antes del código. Hoy los documentos se suben como evidencia de un control (plantillas de evidencia del
> catálogo v1, D36), y eso desaparece con el catálogo v2.

## Actores

| Quién | Qué hace |
|---|---|
| `admin_empresa` | Asigna y cambia el responsable de cada documento; puede hacer todo lo del responsable y aprobar; archiva |
| Responsable del documento (`responsable` o `admin_empresa`) | Crea o importa el documento, mantiene sus versiones, marca el contenido mínimo, define el flujo de aprobación y quién debe aceptarlo, lo envía y atiende la renovación |
| Aprobador (`admin_empresa` o `responsable` elegido por el responsable del documento) | Aprueba o rechaza, con motivo, la versión que recibe |
| Usuario asignado (cualquier rol, incluido `colaborador`) | Lee y acepta la versión vigente dentro del plazo |
| `auditor` | Consulta documentos, aprobaciones y aceptaciones; no aprueba ni acepta |

## Las reglas que lo explican

- **Un documento, un responsable**, aunque sirva a varios controles con responsables distintos (D-01).
- **Una sola versión vigente**; las anteriores se archivan y nunca se borran (D-06).
- **Quien envía no puede ser el único aprobador** (D-03, PR-13): la segregación de funciones la pide SOC 2.
- **El documento cuenta para el control solo si está vigente** (o aprobado con la aceptación en plazo) y completo; si falta, vence o no está aprobado, el control **no pasa de Débil** (R2 del modelo de evaluación, §9).
- **Los documentos externos** (una póliza) no se aprueban ni se aceptan: se cargan con su emisor y su vigencia (D-11).

Los estados de un documento, el flujo paso a paso y los parámetros (PR-06, PR-11 a PR-15) están en D133 y en §9; las tablas, en `datos/modelo/03-catalogo-maestro.md` (el documento del catálogo) y `07-cumplimiento.md` (el documento de la empresa).

## Límites con otros módulos

| Con | Frontera |
|---|---|
| [Catálogo maestro](../catalogo-maestro/README.md) | Trae los 42 documentos sugeridos con su contenido mínimo, roles sugeridos y su `T-DOC` (D129) |
| [Cumplimiento](../cumplimiento/README.md) | Consume el resultado del `T-DOC` en cada requisito del control que lo nombra (§9) |
| [Roles y permisos](../roles-permisos/README.md) | La matriz de la Tabla 2 de la VF18 y el rol `colaborador` (D136) |
| [Notificaciones](../notificaciones/README.md) | Avisos a los aprobadores, recordatorios de aceptación y de renovación (D138) |
| [Trazabilidad](../trazabilidad/README.md) | Cada acción queda en el registro de auditoría (D-13) |

## Dónde está cada dato

| Dato | Dueño |
|---|---|
| Decisiones (`D-n`) | [`datos/decisiones/documentos.md`](../../datos/decisiones/documentos.md): `D133` |
| Reglas del cálculo que lo usan | [`datos/modelo/09-calculo-cumplimiento.md`](../../datos/modelo/09-calculo-cumplimiento.md) (T-01, R2) |
| Contrato | por escribir en `contracts/`, antes de construir RC-09 |
| Código | no existe todavía |
