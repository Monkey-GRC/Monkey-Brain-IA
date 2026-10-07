# Deuda técnica — Onboarding

Parches de los Componentes 1 y 2 del onboarding y del registro de empresa. Contexto: [`README.md`](README.md).

## Componente 2 — Contexto del Servicio (D45)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-12** | 🟠 | **Descripción del Sistema: el archivo se guarda pero no se procesa.** Desde D51 hay enlace y/o archivo (PDF o `.docx`, 25 MB, en S3/minio; sin bucket configurado subir responde `503`), pero **no se procesan las 10 secciones AICPA** (`sections` queda vacío) y por eso **no existen `PUT csocs` / `PUT cuecs`**. *Cerrado de DT-12 el 2026-10-06 (PR #16 del Backend): la carga de archivo.* | El procesamiento del documento exige una decisión sobre cómo se extraen las secciones | Procesar el documento y poblar `sections`; luego los endpoints de `csocs` y `cuecs` |
| ~~DT-13~~ | ✅ | ~~Controles clonados `manual` y sin dimensiones~~ **Cerrada:** Héctor sembró `control_dimensions` (D39) y su clonado (D40) las copia | | |
| **DT-14** | 🟡 | **El clonado es síncrono** (60 s de límite de transacción) y `catalog.status` siempre es `ready`; el `202 processing` del contrato no existe | Con 1 marco tarda unos segundos | Cola/trabajo en segundo plano cuando haya más marcos o catálogos más grandes |
| **DT-15** | 🟡 | **El nombre único del servicio por empresa lo impone la aplicación**, no un índice de la base (una carrera extrema podría duplicarlo) | Evitar otra migración en ese momento | Índice único sobre `(organization_id, lower(name))` |
| **DT-16** | 🟡 | **`evaluation_period` = trimestre natural de la contratación** (`2026-Q4`) | El brain da el formato, no la regla | Confirmar con el comité cómo se define el periodo |
| **DT-17** | 🟡 | `TRUST_CRITERION_REQUIRED` del contrato **no se usa** (el servidor añade `security` en vez de rechazar). `FRAMEWORK_NOT_CONTRACTED` sí, desde D47 | Decisión de diseño más amable con el cliente | Retirarlo del contrato o implementarlo |

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-26** | 🟠 | **Los marcos se contratan solo al registrar la empresa.** No hay forma de añadir, pausar o cancelar un marco **después** (ni endpoint ni pantalla), ni historial del contrato. Una empresa que ya existía antes de la migración 26 **no tiene contrato** y no podría declarar servicios (no se rellenó hacia atrás: no había datos) | Hoy solo SOC 2 es contratable (D50: el catálogo muestra 7 marcos y el resto es `coming_soon`) y el registro lo fija | `PATCH` / pantalla de «Marcos» en Monkey Admin cuando haya un segundo marco (Fase 1) y una regla para el histórico |
| **DT-27** | 🟡 | **El contrato guarda solo el marco y la fecha** (sin vigencia, precio ni condiciones comerciales) y se contrata la **versión vigente** del marco al registrar | El brain no define el contrato comercial | Definirlo con el comité si el contrato debe llevar más |
| **DT-37** | 🟡 | **El freno de intentos de la clave de acceso vive en la memoria de la instancia.** Tope de 10 fallos cada 15 min por dirección en `POST /v1/auth/redeem` y `redeem/lookup`; con varias réplicas del backend el tope real sería por réplica, y se pierde al reiniciar | Evita una dependencia nueva (cola o caché compartida) en el sprint | Guardar el contador en la base o en una caché compartida cuando haya más de una réplica |

## Componente 1 — Contexto Organizacional (D44)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-18** | 🟡 | **Sin guardado parcial en el servidor.** El avance vive en `localStorage` del navegador; el formulario se envía completo al final | Columnas `NOT NULL` | Volver opcionales las columnas y mover la validación de completitud a la aplicación, si el comité quiere borradores |
| **DT-19** | 🟡 | **`business_model` trae 19 de «40+»**; «Otra» regulación no tiene campo de texto | P6 / el modelo no tiene dónde guardarlo | Lista completa del comité |
