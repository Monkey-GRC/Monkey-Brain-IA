# Resultado del escaneo de GCP contra el catálogo

**Estado:** 2026-11-12. Interno: nombra al motor y **nada de esto sale al cliente** (D70, P14 D3). Es el par de
[`cruce-nube-aws.md`](cruce-nube-aws.md) para Google Cloud: el modelo y las reglas son los mismos (D53, D56); este archivo solo
guarda lo **medido** y las reglas de mapeo propias de GCP. Los datos crudos están en `assets/soc2/scan-gcp/` (no versionado:
contienen un proyecto real).

## Qué se escaneó y cómo se conectó

Un proyecto de GCP personal de pruebas (sin facturación, sin VMs, bases de datos ni buckets), con el motor de nube **v5.44.0**, la
misma versión que con AWS, sin filtro de marco: los **110 checks** de su catálogo de GCP. Resultado: **21 hallazgos** (17 `FAIL`,
4 `PASS`), todos con región `global`, y 89 checks sin filas, que son `not_applicable` (D56).

**Conexión de la prueba (manual, solo desarrollo):** un proyecto aparte hizo de «Monkey» con una cuenta de servicio
(`monkey-scanner`). El proyecto del cliente le dio solo lectura (`roles/viewer`, `roles/iam.securityReviewer`,
`roles/stackdriver.accounts.viewer`) y el motor corrió **suplantando** esa cuenta (`--impersonate-service-account`), sin descargar
ninguna clave. Es el equivalente en GCP de asumir el rol de solo lectura de AWS.

**Lo que enseñó la prueba (va al script de alta):**

| Hecho | Consecuencia |
|---|---|
| Al suplantar, las APIs se cobran al **proyecto de la cuenta de servicio**, no al escaneado. Sin `cloudresourcemanager`, `iam` e `iamcredentials` activas ahí, el motor se salta los checks de cuentas de servicio y de federación de identidad **sin fallar la corrida**. | El script de alta deja esas APIs activas en el proyecto de la identidad de Monkey. Un error de API desactivada en ese proyecto es un fallo de conexión, no un `not_applicable`. |
| Dos checks de monitoreo exigen **facturación** en el proyecto de la cuenta de servicio. | Hasta resolverlo, esos dos checks no devuelven nada. |
| Una API del servicio **desactivada en el proyecto escaneado** (compute, SQL, KMS…) significa que el cliente no usa ese servicio. | Sus checks son `not_applicable`, como en AWS. |
| El check `compute_public_address_shodan` necesita una clave de un servicio externo. | Se excluye. |
| Dos corridas con el mismo nombre de salida se **concatenan** en un JSON inválido. | No afecta al trabajador (contenedor y carpeta nuevos por corrida, D57); confirma que el parser falle en voz alta (DT-50). |

**Formato:** la salida OCSF es la de AWS. El parser del backend (`ocsf-parser.ts`) no tiene nada propio de AWS y acepta los 21
hallazgos tal cual. Cambia el contenido: el activo es el proyecto (`cloud.account.uid` = ID del proyecto), la región es `global`
y el `uid` del recurso es el ID del proyecto o el nombre del servicio (`containeranalysis.googleapis.com`), no un ARN.

**Conexión de producción (D112, MD-214):** federación de identidad desde el rol de AWS de Monkey (`monkey-gcp-federation`, con el
`external_id` del activo como sesión) hacia la cuenta de servicio `monkey-reader` que el script de alta crea **en el proyecto del cliente**.
El cliente pega un comando en Cloud Shell y entrega el número de proyecto; el motor solo recibe un token de 1 h.

## Prueba de punta a punta de la conexión (MD-214, 2026-11-13)

En desarrollo, con el backend y el trabajador locales y el mismo proyecto de pruebas: el script de alta corrió en Cloud Shell sin
errores; la **validación** (asumir `monkey-gcp-federation` con la sesión del activo → STS de Google → token de `monkey-reader` →
comprobar proyecto y número) tardó **3 s**; la **evaluación** ejecutó los 110 checks en **44 s** y entregó **25 resultados** (7 pasan,
18 fallan; `T-CLD-001` 7/2, `T-CLD-002` 0/1, `T-CLD-003` 0/13, `T-CLD-010` 0/2). Son 4 más que en el escaneo manual porque el script
activa las APIs de IAM en el proyecto. Herramienta: `Backend/scripts/dev/smoke-gcp.sh` (`declare` y `finish`). Hubo que detener el
trabajador del servidor durante la prueba; desde entonces cada backend tiene su grupo de trabajadores (`RUNNER_POOL`) y ya no hace falta.

## Mapeo propuesto a las pruebas del comité

Se usa la misma función que con AWS (`Backend/prisma/seed/cloud/build.ts`): primero reglas por nombre y luego la categoría del motor.
Sin cambios, las categorías asignan 89 de 110 checks. Las reglas por nombre se escribieron con nombres de AWS, así que se añaden
**siete reglas solo para GCP**, cada una con su precedente en AWS (aprobadas en desarrollo el 2026-11-12; `monkey_proposed`):

| Checks de GCP | Prueba | Precedente en AWS |
|---|---|---|
| `compute_project_os_login_2fa_enabled` | `T-CLD-001` + `T-CLD-011` | Las reglas de MFA van a las dos |
| `compute_subnet_flow_logs_enabled` | `T-CLD-010` | `vpc_flow_logs_enabled` |
| `logging_log_metric_filter_and_alert_*` (todas) | `T-CLD-003` | `cloudwatch_log_metric_filter_*` |
| Alta disponibilidad de SQL, grupos multizona, balanceador, autorreparación | `T-CLD-009` | `multi_az` |
| Borrado suave de buckets, discos que no se borran solos | `T-CLD-003` | `versioning`, `deletion_protection` |
| Escaneo de imágenes de contenedores (2) | `T-CLD-010`, confianza baja | `inspector2_*` |
| `dns_rsasha1_in_use_to_zone_sign_in_dnssec` | `T-CLD-002` | Su gemelo `…key_sign` ya cae en 002 |

**El motor no trae GDPR ni NIST CSF para GCP** (sí ISO 27001:2022, PCI 4.0, HIPAA y SOC 2). No bloquea: el camino de Monkey es por
la prueba; el mapeo del motor solo corrobora.

## Cobertura por prueba del comité

| Prueba | Checks en el catálogo | Hallazgos en el proyecto | PASS | FAIL |
|---|---|---|---|---|
| `T-CLD-001` IAM y privilegiadas | 24 | 5 | 4 | 1 |
| `T-CLD-002` cifrado, red y exposición | 35 | 1 | 0 | 1 |
| `T-CLD-003` logging, alertas y respaldos | 32 | 13 | 0 | 13 |
| `T-CLD-009` multizona | 4 | — | — | — |
| `T-CLD-010` amenazas de red | 3 | 2 | 0 | 2 |
| `T-CLD-011` contraseñas y autenticación | 1 | — | — | — |
| `T-CLD-004`, `005`, `006`, `007`, `008` | 0 | — | — | — |
| **Sin prueba** | 12 | 0 | — | — |

**98 de 110 checks** tienen prueba. Un check puede alimentar más de una prueba, así que las filas no suman 110.

**Los 12 sin prueba** (van a `P15`): parámetros de SQL Server y MySQL (`local_infile`, `external_scripts`, `trace`,
`user_connections`, `user_options`), comportamiento de VMs (`automatic_restart`, `on_host_maintenance_migrate`,
`preemptible_vm_disabled`, `shielded_vm_enabled`, `suspended_without_persistent_disks`), ciclo de vida de buckets y contactos
esenciales de la organización.

## Pendiente

- **Ratificar** las asignaciones de GCP y decidir los 12 sin prueba (`P15`).
- **Escanear con recursos reales** (VMs, SQL, buckets): requiere facturación en el proyecto de pruebas.
- **Pantallas** del flujo de conexión (GCP sigue `coming_soon`, `DT-104`).
- **Azure:** sin probar (`P14` C5).
