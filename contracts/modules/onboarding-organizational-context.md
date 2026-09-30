---
id: contracts-onboarding-c1
name: Contrato — Onboarding Componente 1 (Contexto Organizacional)
description: Los 10 campos del Contexto Organizacional. Se llena una vez por empresa.
type: contract
---

# Componente 1 — Contexto Organizacional

Se llena **una vez por empresa**. Ver `conventions.md` para el sobre y los errores, y
`enums.md` para las listas de opciones.

**Entidades:** `organizations`, `regulations`, `organization_regulations`
(`modelo-datos.md` §6.1).
**Rol:** `admin_empresa`. **App:** Monkey Platform.

## Campos — 9 obligatorios + 1 opcional = 10

El Excel cuenta **10 obligatorios** porque incluye `framework_a_gestionar`, que está **vetado**.
Los que se construyen son 9 obligatorios más `years_in_operation`, opcional — las "diez
preguntas" de `modulos/onboarding.md`.

| Campo | Tipo | Oblig. | Enum | Columna |
|---|---|---|---|---|
| `name` | string | sí | — | `organizations.name` — **solo lectura**, viene de `companies` |
| `description` | text | sí | — | `organizations.description` |
| `size` | enum | sí | `size` | `organizations.size` |
| `industry` | enum | sí | `industry` | `organizations.industry` |
| `business_model` | enum | sí | `business_model` | `organizations.business_model` |
| `years_in_operation` | enum | **no** | `years_in_operation` | `organizations.years_in_operation` |
| `incorporation_countries` | array&lt;enum&gt; | sí | `country` (12) | `organizations.incorporation_countries` (json) |
| `client_countries` | array&lt;enum&gt; | sí | `country` (13, incluye `eu`) | `organizations.client_countries` (json) |
| `compliance_maturity` | enum | sí | `compliance_maturity` | `organizations.compliance_maturity` |
| `regulation_codes` | array&lt;enum&gt; | sí | `regulation` | `N:M` vía `organization_regulations` |

`name` cuenta como campo obligatorio del formulario pero **no se acepta en el request**: se fijó
al registrar el tenant y llega bloqueado. Enviarlo devuelve `422`.

> **No existe campo de framework en este componente.** El comité vetó "framework que desea
> gestionar" a nivel de empresa: los marcos se contratan por servicio (Componente 2). El Excel
> lo trae como `framework_a_gestionar`; **no se construye**.

## `GET /v1/onboarding/organizational-context`

Devuelve lo guardado y el progreso. En el primer acceso, todo `null` salvo `name`.

```json
{
  "statusCode": 200,
  "message": "organizational_context.get",
  "data": {
    "id": null,
    "name": "Next Audit & Consulting S.A.S.",
    "description": null,
    "size": null,
    "industry": null,
    "business_model": null,
    "years_in_operation": null,
    "incorporation_countries": [],
    "client_countries": [],
    "compliance_maturity": null,
    "regulation_codes": [],
    "completion": {
      "required_total": 9, "required_filled": 1,
      "optional_total": 1, "optional_filled": 0
    },
    "is_complete": false
  }
}
```

## `PUT /v1/onboarding/organizational-context`

Es un formulario único por empresa, así que se guarda completo: **crea la organización la primera
vez y la actualiza las siguientes** (mismo endpoint, idempotente). El guardado parcial con `PATCH`
**no se construyó** (D40): el avance mientras el cliente escribe vive en su navegador y al final se
envía todo junto.

```json
{
  "description": "Consultoría de auditoría y cumplimiento para empresas de servicios en LATAM.",
  "size": "from_51_to_200",
  "industry": "bpo_outsourcing",
  "business_model": "consulting",
  "years_in_operation": "from_5_to_10",
  "incorporation_countries": ["co", "pa"],
  "client_countries": ["co", "mx", "us", "eu"],
  "compliance_maturity": "implementing",
  "regulation_codes": ["ley_1581_co", "gdpr_eu", "pci_dss"]
}
```

`200`:

```json
{
  "statusCode": 200,
  "message": "organizational_context.saved",
  "data": {
    "id": "3d9a7c11-42f8-4b6e-9c05-7ae1b2d34f60",
    "name": "Next Audit & Consulting S.A.S.",
    "description": "Consultoría de auditoría y cumplimiento para empresas de servicios en LATAM.",
    "size": "from_51_to_200",
    "industry": "bpo_outsourcing",
    "business_model": "consulting",
    "years_in_operation": "from_5_to_10",
    "incorporation_countries": ["co", "pa"],
    "client_countries": ["co", "mx", "us", "eu"],
    "compliance_maturity": "implementing",
    "regulations": [
      { "code": "ley_1581_co", "name": "Ley 1581", "jurisdiction": "CO" },
      { "code": "gdpr_eu", "name": "GDPR", "jurisdiction": "EU" },
      { "code": "pci_dss", "name": "PCI DSS", "jurisdiction": "global" }
    ],
    "completion": { "required_total": 9, "required_filled": 9, "optional_total": 1, "optional_filled": 1 },
    "is_complete": true
  }
}
```

**Asimetría deliberada:** el request envía `regulation_codes` (array de códigos); el response
devuelve `regulations` (objetos con nombre y jurisdicción), para que el frontend no tenga que
resolverlos por su cuenta.

## `GET /v1/catalogs/regulations`

El catálogo para poblar el multi-select. Devuelve `code`, `name`, `jurisdiction` y la etiqueta
ya traducida según `Accept-Language`. Igual para los demás, en `GET /v1/catalogs/{name}`:
`size`, `industry`, `business_model`, `years_in_operation`, `compliance_maturity` y, **en lugar
del único `country` que decía el contrato**, dos listas: `incorporation_country` (12) y
`client_country` (13, incluye `eu`). Cada opción viaja como `{ value, label }`; las de países
añaden `group` (`country` | `region` | `other`) para que la pantalla muestre `eu` y `other` aparte.
Cualquier usuario con sesión las puede leer. Un nombre que no existe responde `404`.

**Regulaciones `none` y `other`:** son filas de `catalog.regulations` como cualquier otra
(jurisdicción `n/a`), porque `organization_regulations` las referencia por FK: así "Ninguna" queda
guardada como una respuesta real, distinta de no haber contestado. **"Ninguna" es excluyente**
(no puede ir con otras: `422` con `regulation.none_exclusive`). "Otra" queda solo marcada, sin
campo de texto, porque el modelo no tiene dónde guardar el detalle (D40).

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_empresa` |
| 422 | `VALIDATION_FAILED` | Valor fuera del enum, array vacío en un multi-select obligatorio, `description` >2000 |
| 422 | `VALIDATION_FAILED` | Se envió `name` (campo `name` con código `field.not_editable`, como en el ejemplo de abajo) o se combinó «Ninguna» con otras regulaciones (`regulation.none_exclusive`) |
| ~~409~~ | ~~`ORGANIZATION_ALREADY_EXISTS`~~ | **Retirado (D40):** citaba un `POST` que el contrato nunca definió. `PUT` crea o actualiza |

Ejemplo de validación:

```json
{
  "statusCode": 422,
  "message": "validation.failed",
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "fields": [
      { "field": "size", "code": "enum.invalid", "message": "El valor no está entre las opciones permitidas." },
      { "field": "incorporation_countries", "code": "array.min", "message": "Selecciona al menos un país." },
      { "field": "name", "code": "field.not_editable", "message": "La razón social se fijó al registrar la empresa." }
    ]
  }
}
```

Claves i18n: `organizational_context.get`, `organizational_context.saved`,
`field.not_editable`, `organization.already_exists`, `validation.failed`, `enum.invalid`,
`array.min`, `string.max`, `required`.

## Notas

- `regulations` es tabla propia y **no se puntúa** (decisión D10): determina qué le aplica al
  cliente, no entra al cálculo de cumplimiento.
- `completion` cuenta campos de formulario. **No es un porcentaje de cumplimiento** y no se
  presenta como métrica de readiness (`philosophy.md`).
- `business_model`: el modelo dice "40+ opciones" y el Excel lista 19. Hasta que el comité
  entregue la lista completa, el enum tiene esas 19 más `other`.

## Preguntas abiertas

Ninguna de las 5 de `modelo-datos-pendientes.md` bloquea este componente. Dos cosas por cerrar
al implementar:

- La lista completa de `business_model` (el Excel dice "40+", trae 19).
- `organizations` no tiene `created_at`/`updated_at` en el diagrama de §6.1, a diferencia de
  `companies`. El response de arriba no los expone; si se añaden al modelo, se añaden aquí.

## Estado de implementación (2026-09-30)

Implementado en `Backend/src/features/onboarding` y `catalogs`, y en
`Frontend-Platform/src/app/features/onboarding` (asistente). Decisiones D40.

| Endpoint | Estado |
|---|---|
| `GET /v1/onboarding/organizational-context` | ✅ Solo `admin_empresa`. Sin nada guardado devuelve la razón social y el resto vacío (1 de 9) |
| `PUT /v1/onboarding/organizational-context` | ✅ Formulario completo; crea o actualiza. La razón social se copia de `companies` al crear y no se toca después |
| `PATCH` (guardado parcial) | ❌ No se construyó (D40): las columnas de `organizations` son `NOT NULL` y cambiarlo exige migración |
| `GET /v1/catalogs/{name}` | ✅ `size`, `industry`, `business_model`, `years_in_operation`, `incorporation_country`, `client_country`, `compliance_maturity`, `regulations` |

- **Validación** (todos los errores a la vez, con el código del campo): valores fuera de catálogo
  (`enum.invalid`), listas vacías (`array.min`) o con repetidos (`array.unique`), `description` de más
  de 2000 (`string.max`), `name` (`field.not_editable`), «Ninguna» con otras
  (`regulation.none_exclusive`). `eu` no vale como país de constitución.
- **Auditoría:** cada guardado escribe `organizational_context.save` en `audit_logs` con el estado
  antes (`null` la primera vez) y después (CC9.2).
- **Seed:** `catalog.regulations` se siembra con `npx prisma db seed` (14 filas, idempotente).
- **Etiquetas:** `i18n/{es,en}/catalogs.json`. Las de español son las del Excel; **las de inglés las
  tradujo desarrollo** (el Excel solo las trae en español, salvo `size`) y quedan pendientes de revisión
  del comité. Platform todavía no tiene i18n instalada: hoy el cliente ve todo en español.
- **Pantalla (Platform):** asistente de 5 pantallas cortas más una de revisión
  (Tu empresa · Tamaño · Tu negocio · Alcance · Cumplimiento). El avance se guarda en el navegador
  (`localStorage`, por usuario) y se borra al guardar en el backend; si el cliente ya había guardado,
  entra directo a la revisión con lo guardado y puede editar. El progreso es "Paso 2 de 5", nunca un
  porcentaje de cumplimiento (`philosophy.md`).
- **Sin definir en el brain, resuelto con el supuesto más conservador:** ver D40.
