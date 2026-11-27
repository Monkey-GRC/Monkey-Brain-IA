# Catálogo de Microsoft 365 contra las pruebas del comité

**Estado:** 2026-11-22. Interno: nombra al motor y **nada de esto sale al cliente** (D70, P14 D3). Es el par de [`cruce-nube-aws.md`](cruce-nube-aws.md) y
[`cruce-nube-gcp.md`](cruce-nube-gcp.md) para Microsoft 365: el modelo y las reglas son los mismos (D53, D56); este archivo guarda lo **medido** en
esta plataforma (D154) y qué checks cuentan según el comité. **No se ha escaneado un tenant real todavía** (`DT-138`): lo de aquí sale de la imagen del motor, no de una corrida.

## Qué se midió y cómo

Sobre la imagen fijada `toniblyx/prowler` **5.44.0** (la misma de AWS y GCP), su proveedor `m365`:

| Hecho | Dato |
|---|---|
| Checks del proveedor | **144** en 10 servicios (`entra` 76, `defender` 18, `exchange` 17, `teams` 16, `admincenter` 7, `sharepoint` 5, `defenderxdr` 2, `defenderidentity`, `intune` y `purview` 1 cada uno) |
| Severidad del motor | 12 críticos, 56 altos, 67 medios, 9 bajos |
| Autenticación | `--certificate-auth` (recomendada), `--sp-env-auth` (secreto), `--az-cli-auth`, `--browser-auth`. Variables: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `M365_CERTIFICATE_CONTENT` (PFX en base64). **No acepta un token ya emitido ni federación** |
| PowerShell | La imagen trae **PowerShell 7.5.11** y los módulos `ExchangeOnlineManagement`, `MicrosoftTeams` y `MSAL.PS` ya instalados |
| Identidad en la salida | `account_uid` = el **dominio** del tenant y `account_organization_uid` = su **ID**; el parser no usa la cuenta |
| Marcos que trae | CIS 4.0, 6.0 y 7.0, **ISO 27001:2022** y su propio puntaje. **No trae SOC 2, HIPAA, GDPR, PCI ni NIST CSF** |
| El PFX que genera Monkey | Lo aceptan `azure-identity` y `cryptography` de la imagen (contraseña vacía o nula) y .NET con su clave privada (verificado el 2026-11-22) |

## Qué checks cuentan (lo define el comité)

La asignación de checks a pruebas es la de la hoja `TEST_CHECKS` de la VF18 (D128, D129; `committee_ratified`). Monkey no propone asignaciones propias:
la propuesta por reglas de nombre que este archivo describía se descartó al cargar el libro. Cifras de `Backend/prisma/seed/data/catalog-v2.json`
(motor 5.45.0):

| Dato | Microsoft 365 |
|---|--:|
| Checks en el catálogo | 149 |
| Checks usados por alguna prueba | 40 |
| Checks que no usa ninguna prueba (no deciden nada) | 109 |
| Vínculos prueba–check | 49 (13 Directos, 33 Complementarios, 3 de Dependencia) |
| Pruebas con algún check de Microsoft 365 | 14 |

Las 14 pruebas: `T-ACT-3-05`, `T-ACT-4-05`, `T-CIF-3-06`, `T-CIF-4-03`, `T-EQU-1-03`, `T-EQU-2-01`, `T-IDA-1-02`, `T-IDA-11-03`, `T-IDA-4-01`,
`T-IDA-4-04`, `T-IDA-7-03`, `T-MNT-2-06`, `T-MOV-1-01` y `T-TRD-1-04`.

**Versiones distintas.** El trabajador usa la imagen 5.44.0 (144 checks) y el catálogo es el de la 5.45.0 (149). Los 149 tienen título en español; falta comprobar cuántos ejecuta la imagen en uso (`DT-138`).

## Evaluar sin entregar la llave al motor (D156; comprobado con un tenant real el 2026-11-25)

El motor no ofrece autenticarse con permisos ya emitidos, pero las bibliotecas que usa sí. Con un arranque propio (`Backend/src/runner/infrastructure/providers/microsoft365/microsoft-365-engine-entry.ts`) el contenedor recibe **solo tres
permisos temporales de esa organización** (Graph, Exchange Online y Teams), pedidos por Monkey con la llave, que nunca entra. Comparado con la corrida con certificado, con la misma aplicación:
**las 651 filas salieron iguales** (ninguna cambió ni faltó) y aparecieron **16 filas más, de Teams** (ninguna de las que cuentan hoy). En ambas llegaron 33 de los 40 checks vinculados.

**Qué habilita:** retirar la excepción a `SEG-46` del punto 7 de D154 y, si el equipo lo aprueba, evaluar una **aplicación única de Monkey** autorizada por consentimiento (sin que el motor vea la llave maestra).
**Qué no demuestra:** es un solo tenant; el consentimiento con una aplicación única no se ha probado; el arranque depende de partes internas del motor (falla en voz alta si cambian) y habría que
mantenerlo en cada actualización; los permisos duran cerca de 1 hora. Ya es parte del trabajador (D156); la forma de autorizar la conexión aún no cambia.

## Lo que no se sabe todavía (`DT-138`)

- Qué devuelve el motor en un tenant real: formato exacto de `resources[].uid` en los checks de tenant, cuántos checks quedan `not_applicable` por licencia (los de PIM y revisión de accesos exigen Entra ID P2) y si algún campo difiere del OCSF de AWS y GCP (el parser falla en voz alta, DT-50).
- Si, con solo los permisos de Microsoft Graph, el motor omite sin ruido los checks de Exchange y Teams (PowerShell) o los reporta con error.
- Cuánto tarda un escaneo completo (el de AWS tarda unos 2 minutos).
- Los nombres exactos de los permisos de Graph en un tenant real y el consentimiento del script de alta.

## Pendiente

- **Probar con un tenant de Microsoft 365** y ajustar lo que falle; luego pasar la plataforma a `available` (una migración de datos aparte).
- **Medir la cobertura real** de las 14 pruebas del comité en ese tenant (con solo Microsoft Graph pueden faltar checks).
- **Alinear la versión del motor** con la del libro (5.45.0).
- **Renovación del certificado** antes de que venza (`DT-137`).
- **Exchange y Teams** (PowerShell): el script de alta ya soporta `MONKEY_POWERSHELL=1`; falta decidir si se activan y medir su cobertura.
