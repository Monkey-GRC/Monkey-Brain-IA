---
id: contracts-compliance-gaps
name: Contrato — Cumplimiento, mensaje de brecha
description: Cada FAIL de un check Directo de una prueba, en un activo, con la plantilla de D138 y su prioridad; los Complementarios en FAIL como observación.
type: contract
---

# Cumplimiento — mensaje de brecha

| | |
|---|---|
| **Estado** | **ACORDADO** (D138 punto 3, D141 punto 3, D162, RC-18; MD-502). Reemplaza el «Qué falló y cómo corregirlo» de D90 (antes en [`veredictos.md`](veredictos.md)) |
| **App** | Monkey Platform (detalle del control). Monkey Admin no lo ve: son datos de cumplimiento del cliente |
| **Contexto común** | Quién puede qué, estado general y errores comunes: [`README.md`](README.md) |
| **Entidades** | `check_results`, `executions`, `evaluations`, `exclusions`, `remediation_plans`, `assets` (`modelo-datos.md` §7, §8, §9) · enums: [`enums/cumplimiento.md`](../enums/cumplimiento.md) (`gap_priority`), [`enums/control-tecnico.md`](../enums/control-tecnico.md) (`severity`) |

Cada **FAIL de un check Directo** de una prueba automática, **en un activo**, se muestra como una **brecha** con la plantilla del libro (D138 punto 3). Un check **Complementario** en FAIL no es brecha: sale como **observación**, sin prioridad. Un FAIL con una **excepción vigente** ([`exclusiones.md`](exclusiones.md)) sale marcado y no cuenta como brecha abierta.

## La plantilla (D138 punto 3)

| Parte | De dónde sale | Campo |
|---|---|---|
| Encabezado: «[control] · [test] – [activo] no cumple: [título del check]» | El control, la prueba, el activo y el título del check | `control`, `test`, `asset`, `title` (la pantalla arma la frase con su clave i18n) |
| Qué se evaluó | La descripción del check del catálogo, traducida | `evaluated` |
| Qué debe corregir | La guía de corrección del check, traducida | `remediation` |
| Prioridad | Severidad del check × criticidad del activo (regla abajo) | `priority`, `priority_basis` |
| Cómo se cierra | Siempre igual: un nuevo PASS del mismo check en el mismo activo, en una recolección posterior | Texto fijo de la pantalla (i18n); no viaja |
| Responsable y fecha compromiso | El plan de remediación vigente de la prueba, si lo hay; si no, el responsable del control y sin fecha | `owner`, `due_date` |

### Prioridad (D162)

Cada parte se pasa a un nivel: `low` = 1, `medium` = 2, `high` = 3, `critical` = 4; la severidad `informational` cuenta como 1.

- **Con severidad** (motor de nube): `priority` = el promedio de los dos niveles **redondeado hacia arriba**. Un check `critical` en un activo de criticidad `low` → (4 + 1) / 2 = 2,5 → 3 = `high`.
- **Sin severidad** (la sonda no califica sus checks, D141 punto 3): `priority` = la criticidad del activo.
- `priority_basis` dice de qué salió (`{ severity, asset_criticality }`, con `severity: null` en la sonda), para que la pantalla lo explique.

## Índice de endpoints

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| `GET` | [`/v1/controls/{control_id}/tests/{test_id}/findings`](#get-v1controlscontrol_idteststest_idfindings--brechas-de-una-prueba) | `admin_empresa` · `auditor` · dueño y ejecutor del control | Las brechas y observaciones de una prueba automática |

---

### GET /v1/controls/{control_id}/tests/{test_id}/findings — Brechas de una prueba

| | |
|---|---|
| **Quién** | `admin_empresa` · `auditor` · **el responsable y el delegado de ese control** (D102: son quienes la reparan) |
| **Éxito** | `200`, paginada (`page`, `page_size`) sobre `items`: primero las brechas abiertas por prioridad (de `critical` a `low`), luego las exceptuadas y al final las observaciones; dentro de cada grupo, por título |
| **Errores** | `403` (otro `responsable` o `delegado`, `admin_monkey`) · `404` (el control no lleva la prueba, o la prueba no es automática) |

**Qué lee.** La **última corrida completada** de cada activo del servicio que mide la prueba (una cuenta de nube, un servidor con agente), solo los resultados `failed` de los checks **vinculados a la prueba en el catálogo v2**, con su rol (Directo o Complementario). **Una fila por check y activo.** Un recurso descubierto que no es del servicio no se cuenta. Es la misma regla con la que el motor v2 calcula la prueba: lo que aquí sale como brecha abierta es lo que hace que la prueba esté en Excepción.

#### Parámetros (query)
| Campo | Tipo | Obligatorio | Regla |
|---|---|---|---|
| `page`, `page_size` | integer | no | Ver `conventions.md` |

#### Response `200`
| Campo | Tipo | Qué es |
|---|---|---|
| `control` | `{ id, code, name }` | El control del cliente |
| `test` | `{ id, code, display_name }` | |
| `measured_at` | datetime \| null | La corrida más reciente que se leyó; nulo si no hay ninguna (y entonces `items: []`) |
| `summary` | `{ open_gaps, excepted, observations }` | Cuántos ítems hay de cada tipo (sin paginar) |
| `items[].id` | string | Estable por check y activo |
| `items[].kind` | `gap` \| `excepted` \| `observation` | `gap`: FAIL de un Directo sin excepción. `excepted`: FAIL de un Directo con excepción vigente. `observation`: FAIL de un Complementario |
| `items[].asset` | `{ id, name, criticality }` | El activo donde falla, con el nombre que le dio el cliente. `criticality`: enum `asset_criticality` |
| `items[].title` | string | El check en positivo («lo que debería cumplirse»), traducido |
| `items[].evaluated` | `{ text, language, is_ai_generated }` \| null | Qué se evaluó. `null` si el catálogo no lo trae o nombra al proveedor |
| `items[].remediation` | `{ text, language, is_ai_generated }` \| null | Qué debe corregir. Mismo formato que hoy: párrafos, viñetas con `- ` y comandos entre tres comillas invertidas (D113) |
| `items[].priority` | enum `gap_priority` \| null | Solo en `gap` y `excepted`; `null` en `observation` |
| `items[].priority_basis` | `{ severity, asset_criticality }` \| null | `severity`: enum `severity` o `null` (sonda). `null` en `observation` |
| `items[].resources[]` | `{ name, uid, region }` | Los recursos del activo que fallan (nube), hasta 50; `[]` en un servidor (el activo es el recurso) |
| `items[].resources_total` | integer | |
| `items[].exception` | `{ id, effective_until }` \| null | Solo en `excepted`: la excepción que lo deja pasar |
| `items[].owner` | `{ id, name, last_name }` \| null | Quién lo corrige: el responsable del plan de remediación vigente de la prueba; si no hay plan, el responsable del control; `null` en `observation` |
| `items[].due_date` | date \| null | La fecha del plan de remediación vigente; `null` sin plan |
| `items[].failing_since` | datetime | La primera corrida, de la racha actual, en que ese check falló en ese activo |

```json
{
  "statusCode": 200,
  "message": "finding.list",
  "data": {
    "control": { "id": "c1d2…", "code": "IAC-4", "name": "Doble factor en cuentas privilegiadas" },
    "test": { "id": "21ab…", "code": "T-IAC-4-01", "display_name": "Cuentas privilegiadas con doble factor" },
    "measured_at": "2026-11-27T05:40:00Z",
    "summary": { "open_gaps": 1, "excepted": 0, "observations": 1 },
    "items": [
      {
        "id": "8f10…:3c2b…",
        "kind": "gap",
        "asset": { "id": "8f10…", "name": "cuenta-produccion", "criticality": "low" },
        "title": "La cuenta raíz tiene doble factor activado",
        "evaluated": { "text": "Que la cuenta raíz exija un segundo factor al iniciar sesión.", "language": "es", "is_ai_generated": true },
        "remediation": { "text": "Activa el doble factor en la cuenta raíz…", "language": "es", "is_ai_generated": true },
        "priority": "high",
        "priority_basis": { "severity": "critical", "asset_criticality": "low" },
        "resources": [ { "name": "root", "uid": "…", "region": null } ],
        "resources_total": 1,
        "exception": null,
        "owner": { "id": "a1b2…", "name": "Laura", "last_name": "Gómez" },
        "due_date": "2026-12-15",
        "failing_since": "2026-11-20T05:40:00Z"
      },
      {
        "id": "8f10…:77e1…",
        "kind": "observation",
        "asset": { "id": "8f10…", "name": "cuenta-produccion", "criticality": "low" },
        "title": "Las claves de acceso se rotan cada 90 días",
        "evaluated": null,
        "remediation": { "text": "Rota las claves de acceso…", "language": "es", "is_ai_generated": true },
        "priority": null,
        "priority_basis": null,
        "resources": [ { "name": "ci-deploy", "uid": "…", "region": null } ],
        "resources_total": 1,
        "exception": null,
        "owner": null,
        "due_date": null,
        "failing_since": "2026-11-27T05:40:00Z"
      }
    ],
    "page": 1, "page_size": 25, "total": 2, "total_pages": 1
  }
}
```

#### Reglas
- **Idioma y procedencia.** Sale en el idioma de la sesión. El catálogo trae los textos en inglés; Monkey los traduce con IA (`is_ai_generated: true`, la pantalla lo etiqueta como traducción automática). Sin traducción, sale el original con `language: "en"`.
- **Nada nombra al proveedor (D70, D90, tabla 9 de `01_DESARROLLO`).** Ningún identificador del motor ni de la sonda sale (ni el código del check ni el tipo de recurso). Un texto que nombre al proveedor se omite (`null`; el título cae a un texto neutro). El mensaje crudo por recurso del motor (`status_detail`) no sale.
- **La IA no certifica (regla 3):** el mensaje describe lo que midió la sonda o el motor; no dice que el control cumple ni que no cumple.
- **Un solo armador.** El aviso `direct_check_failed` (`contracts/notificaciones.md`) usa el mismo mensaje y la misma prioridad.

## Errores del módulo

Solo los comunes (`FORBIDDEN`, `NOT_FOUND`), en [`README.md`](README.md#errores-comunes).

**Claves i18n:** `finding.list`.

---

## Estado de implementación

**Construido (D90, MD-177, D113):** la ruta con `title`, `severity`, `resources` y `remediation`, una fila por check (no por check y activo), con los checks del catálogo v1.

**En construcción (MD-502):** el catálogo v2 (rol Directo o Complementario), una fila por check y activo, `kind`, `asset`, `evaluated`, `priority` y `priority_basis`, `exception`, `owner`, `due_date`, `failing_since`, `control`, `test` y `summary`. Se retira `items[].severity` (pasa a `priority_basis.severity`). La pantalla del detalle del control en Platform muestra una tarjeta por ítem.
