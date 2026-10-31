# Resultado del escaneo de AWS contra el catálogo

**Estado:** 2026-10-08. Interno: nombra al motor y **nada de esto sale al cliente** (D70, P14 D3). Las decisiones que salen de aquí
están en `D53` y `D56` (`../datos/modelo-datos-decisiones.md`); el modelo, en `modelo-datos.md` §3.3 y §8. Este archivo solo guarda lo
**medido**. Los datos crudos están en `assets/soc2/` (no versionado: contienen una cuenta real).

## Qué se escaneó

Una cuenta de AWS de pruebas, `us-east-1` y `us-east-2`, con el motor de nube v5.44.0 **sin filtro de marco**: 655 checks aplicables
de los 662 de su catálogo de AWS (Azure trae 191 y GCP 110). Resultado: 403 hallazgos (277 `PASS`, 120 `FAIL`, 6 `MANUAL`), 139 checks
con filas y 74 recursos distintos.

El primer escaneo (2026-10-07) usó el marco SOC 2 del propio motor: ejecutó solo los 171 checks de ese marco (70 devolvieron filas), y
por eso no aparecían MFA de root, política de contraseñas, cifrado por defecto ni respaldos.

**Un check sin filas no es un check que pasó:** 516 de los 655 no devolvieron nada porque la cuenta no tiene esos recursos (no hay S3,
RDS ni claves KMS propias). Se trata como `not_applicable` (D56, DT-50).

## Cobertura por prueba del comité

El catálogo (662 checks) se asigna a las pruebas `T-CLD` por propuesta (`monkey_proposed`, D56): 569 asignaciones, 133 corroboradas por
el propio mapeo SOC 2 del motor. Con los resultados de esta cuenta:

| Prueba | Checks en el catálogo | Con resultado en la cuenta | PASS | FAIL | MANUAL |
|---|---|---|---|---|---|
| `T-CLD-001` IAM y privilegiadas | 103 | 28 | 31 | 20 | 0 |
| `T-CLD-002` cifrado, red y exposición | 258 | 56 | 216 | 27 | 1 |
| `T-CLD-003` logging, alertas y respaldos | 125 | 28 | 1 | 41 | 2 |
| `T-CLD-008` respaldos operativos | 5 | 1 | 0 | 1 | 0 |
| `T-CLD-009` multi-zona | 17 | 1 | 0 | 2 | 0 |
| `T-CLD-010` amenazas de red | 48 | 2 | 0 | 4 | 0 |
| `T-CLD-011` contraseñas y autenticación | 13 | 11 | 2 | 9 | 0 |
| `T-CLD-004`, `005`, `006`, `007` | 0 | — | — | — | — |
| **Sin prueba** | 104 | 17 | 29 | 19 | 3 |

Un check puede alimentar más de una prueba, así que las filas no suman 403.

## Atributos que el comité pide validar y ningún check cubre

Medido contra `tests.attributes_to_validate`: acceso condicional (es de Entra ID) y aprobación de privilegiadas (`T-CLD-001`); bloqueo de
cuenta (AWS IAM no lo ofrece, `T-CLD-011`); ubicación separada y pruebas de restauración (`T-CLD-003`, `T-CLD-008`); cifrado en
tránsito y gestión de claves y secretos (`T-CLD-002`: la cuenta no tiene esos recursos, no es que el motor no los cubra); multi-zona
(`T-CLD-009`: parcial). Esos atributos quedan **manuales por activo**, con evidencia que sube el cliente.

## Pendiente

- **Azure y GCP:** la prueba con una cuenta real está planificada para más adelante (P14 C5).
- **Regiones declaradas:** se escaneó donde había recursos; la cuenta debe declararlas (D53).
