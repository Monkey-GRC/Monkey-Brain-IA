---
id: contracts
name: Contratos de API
description: Forma exacta de cada endpoint (request, response y errores), acordada entre backend y frontend antes de construir.
type: contract
---

# Contratos de API

**Qué es:** la forma exacta de cada endpoint —request, response y errores— acordada antes de
escribir código, para que backend y frontend no se esperen mutuamente ni rehagan formularios
por un cambio de payload.

**Obligatorio:** antes de construir un endpoint o un formulario, lee el archivo del módulo que
te toca. Si lo que vas a construir no está aquí, el contrato se acuerda primero.

## Estructura

**Un módulo, un archivo; un módulo con componentes, una carpeta** — los mismos nombres que
`references/arquitectura/` (`STANDARD.md` §2b). Si sabes de qué parte del producto hablas, sabes qué contrato abrir.

### Transversal

| Archivo | Qué trae |
|---|---|
| [`conventions.md`](conventions.md) | Sobre de respuesta, forma del error, i18n, multi-select, fechas, paginación |
| [`enums.md`](enums.md) | Índice de los enums: `valor` ↔ etiqueta es ↔ etiqueta en. Los valores viven en [`enums/`](enums/) con la misma estructura por módulo y componente |

### Por módulo

| Módulo | Contrato | Qué trae |
|---|---|---|
| Autenticación | [`autenticacion.md`](autenticacion.md) | Canje de la clave, login, refresh, segundo factor, activación y contraseña |
| Gestión de usuarios | [`gestion-usuarios.md`](gestion-usuarios.md) | El administrador crea al equipo (`responsable`, `delegado`, `auditor`), se organizan en grupos y se asigna el dueño y el ejecutor de cada control |
| | [`gestion-usuarios/administradores.md`](gestion-usuarios/administradores.md) | Monkey Admin: un `admin_monkey` invita, desactiva (7 días de gracia y luego se borra) y reactiva a otros administradores; el sello de la auditoría |
| Empresas | [`empresas.md`](empresas.md) | Registro del tenant y clave de acceso (`companies`, `access_keys`) |
| Catálogo maestro | [`catalogo-maestro.md`](catalogo-maestro.md) | Monkey Admin: ver y gestionar el catálogo (marcos, controles, riesgos, causas, pruebas, evidencias) |
| Onboarding | [`onboarding/contexto-organizacional.md`](onboarding/contexto-organizacional.md) | Componente 1 — 10 campos de la empresa |
| | [`onboarding/contexto-servicio.md`](onboarding/contexto-servicio.md) | Componente 2 — 16 campos, repetible por servicio |
| | [`onboarding/conexion-activos/`](onboarding/conexion-activos/README.md) | Componente 3 — conexión de activos: rol, llaves, agente, validación y activación  — partido en `conectar`, `validar` y `gestionar` |
| | [`onboarding/cargos-responsables.md`](onboarding/cargos-responsables.md) | Los cargos de la organización que responden ante el auditor |
| Control técnico | [`control-tecnico.md`](control-tecnico.md) | Operación continua: ejecuciones, preparación, hallazgos y API interna del trabajador |
| Cumplimiento | [`cumplimiento/controles.md`](cumplimiento/controles.md) | Controles: listar, ver, crear un control propio, editar y dar de baja |
| | [`cumplimiento/resumen.md`](cumplimiento/resumen.md) | El resumen del servicio por marco y categoría |
| | [`cumplimiento/evidencia.md`](cumplimiento/evidencia.md) | Evidencias: subir con huella y versión, descargar con enlace firmado, validar o rechazar |
| | [`cumplimiento/veredictos.md`](cumplimiento/veredictos.md) | Los tests de un control, qué falló y cómo corregirlo, y el veredicto de una prueba manual |
| | [`cumplimiento/observaciones.md`](cumplimiento/observaciones.md) | Lo que escribe el auditor y cómo lo responde la empresa |
| | [`cumplimiento/exclusiones.md`](cumplimiento/exclusiones.md) | Sacar un activo de un test, con vigencia |
| | [`cumplimiento/riesgos.md`](cumplimiento/riesgos.md) | Riesgos y causas, vínculos, evaluación 5×5 y tratamiento |

Lo que comparten los contratos de Cumplimiento (quién puede qué y el estado general) está en
[`cumplimiento/README.md`](cumplimiento/README.md).

Cómo funciona cada módulo por dentro: [`references/arquitectura/`](../skills/product/monkey-compliance-council/references/arquitectura/README.md).

## Formato de un contrato

Todos los archivos de este directorio siguen la misma estructura, para que se lean igual y una persona o una IA encuentre cada dato en el mismo sitio. El contrato dice **qué**, no **por qué**: el porqué de una decisión vive en `datos/decisiones/README.md` (se enlaza como `D-n`).

### Estructura de un archivo de módulo

1. **Cabecera** (front matter) y título.
2. **Resumen** en una tabla de dos filas: *Estado* (acordado, construido o por construir, con su `D-n`) y *App / entidades* (de `modelo-datos.md`).
3. **Índice de endpoints:** una tabla con método, ruta, quién puede y para qué.
4. **Una ficha por endpoint**, siempre igual (abajo).
5. **Reglas de negocio** del módulo, en lista corta, solo lo que no cabe en una ficha.
6. **Errores del módulo** (tabla) y **claves i18n**.
7. **Estado de implementación** (al final, separado): qué está construido, qué falta. Es histórico; no se mezcla con las fichas.
8. **Preguntas abiertas** (`P-n`), si las hay.

### Ficha de un endpoint

````markdown
## POST /v1/users — Crear una persona del equipo

| | |
|---|---|
| **Quién** | `admin_empresa` · `responsable` (solo `delegado` de su equipo) |
| **Éxito** | `201` |
| **Errores** | `403` · `409 EMAIL_TAKEN` · `422` |

### Request
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `email` | string | sí | Único en toda la plataforma |

```json
{ "email": "juan@acme.co" }
```

### Response `201`
| Campo | Tipo | Qué es |
|---|---|---|
| `id` | uuid | |

```json
{ "statusCode": 201, "message": "user.created", "data": { "id": "c4a1…" } }
```

### Errores
| HTTP | Código | Cuándo |
|---|---|---|
| 409 | `EMAIL_TAKEN` | Ese correo ya tiene cuenta |

> **Regla:** el texto explicativo va aquí, en un bloque corto. Nada de párrafos largos entre tablas.
````

Reglas del formato:
- **Campos siempre en tabla** (nombre, tipo, obligatorio, regla); el JSON de ejemplo va **debajo**, nunca en lugar de la tabla.
- **Query y path:** una tabla «Parámetros» con las mismas columnas que *Request*.
- **El sobre** (`statusCode`, `message`, `data`) y la paginación están en `conventions.md`; las fichas solo muestran el `data` cuando el sobre es el estándar.
- **Un endpoint sin cuerpo** pone «Sin cuerpo» en *Request*.
- **Los errores comunes** (`401`, `403`, `404`, `422` genérico) se listan una vez en la cabecera de la ficha; la tabla solo trae los propios del endpoint.
- **Los valores de enum** se escriben con su nombre (`user_role`) y enlazan a `enums.md`; nunca se copian.
- Los **identificadores** (campos, rutas, códigos de error) van en inglés; el texto explicativo, en español.

## Formato de un enum

Cada enum es una **sección con una tabla**, nunca una línea corrida:

````markdown
## `asset_criticality`
**Columna:** `assets.criticality` · **Quién lo fija:** el cliente al declarar el activo

| Valor | Etiqueta (es) | Qué significa |
|---|---|---|
| `low` | Baja | Su caída no afecta la operación |
| `critical` | Crítica | |

> **Nota:** flujos, retirados y decisiones van aquí, debajo de la tabla, no en el título.
````

- El título es solo el nombre del enum, para que el índice lateral del editor se lea bien.
- **«Qué significa»** se llena solo cuando el valor no se entiende por sí mismo.
- Si un enum tiene varias etiquetas (es/en), la tabla lleva una columna por idioma.
- Si un enum agrupa otros del mismo tema, se separan con un título `##` de grupo.

## Quién manda si hay conflicto

1. `assets/TSC INTERGRAL SOC 2 DETALLADO VF2.xlsx` — la fuente del comité. Trae `clave_json`,
   `tipo`, `opciones (pipe)` y un `fragmento_json` por campo. De ahí salen las **listas de
   opciones** y la semántica de cada campo.
2. `references/datos/modelo-datos.md` §4-§9 — de ahí salen los **nombres de campo y de entidad**, en
   inglés. Las `clave_json` del Excel están en español y no viajan por el cable.
3. Este directorio — la forma HTTP concreta.

Si el Excel y el modelo discrepan en las **opciones** de un enum, gana el Excel y se corrige el
modelo. Si discrepan en el **nombre** de un campo, gana el modelo.

## Versionado

Un cambio que rompe un contrato ya publicado se anuncia en el módulo afectado con la fecha y
qué cambió, y el tech-lead avisa al otro lado antes de mergear. Añadir un campo opcional no
rompe; quitar un campo, renombrarlo, cambiar su tipo o quitar un valor de enum, sí.

## Confidencialidad

Ningún campo, valor de enum, mensaje de error o ejemplo de este directorio nombra al proveedor
del motor de monitoreo. En la API se habla de `automated_capability`, "sonda" o "evaluación
automática". `automated_capabilities.provider` existe en el modelo pero **nunca sale en un
response al cliente**.
