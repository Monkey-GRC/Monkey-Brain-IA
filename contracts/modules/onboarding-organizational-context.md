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

Es un formulario único por empresa, así que se guarda completo. `PATCH` sirve para el guardado
parcial mientras el cliente escribe (mismo cuerpo, claves presentes solo).

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
ya traducida según `Accept-Language`. Igual para `size`, `industry`, `business_model`,
`years_in_operation`, `country` y `compliance_maturity` en `/v1/catalogs/{enum}`.

## Errores

| HTTP | `error.code` | Cuándo |
|---|---|---|
| 403 | `FORBIDDEN` | El rol no es `admin_empresa` |
| 422 | `VALIDATION_FAILED` | Valor fuera del enum, array vacío en un multi-select obligatorio, `description` >2000 |
| 422 | `FIELD_NOT_EDITABLE` | Se envió `name` |
| 409 | `ORGANIZATION_ALREADY_EXISTS` | `POST` sobre una empresa que ya declaró su organización — usar `PUT` |

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
