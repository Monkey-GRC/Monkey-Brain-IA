# Deuda técnica — Onboarding

Parches de los Componentes 1 y 2 del onboarding y del registro de empresa. Contexto: [`README.md`](README.md).

## Componente 2 — Contexto del Servicio (D45)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-12** | 🟠 | **Descripción del Sistema: el archivo se guarda (D51) pero no se procesa.** No se leen las 10 secciones AICPA (`sections` queda vacío) y por eso **no existen `PUT csocs` / `PUT cuecs`**. La carga de archivo (multipart, 25 MB, PDF/docx) ya existe, sin probar contra el minio real (DT-39) | Falta el procesamiento del documento | Procesar el documento (IA) y sembrar `sections`, `csocs` y `cuecs` |
| ~~DT-13~~ | ✅ | ~~Controles clonados `manual` y sin dimensiones~~ **Cerrada:** Héctor sembró `control_dimensions` (D39) y su clonado (D40) las copia | | |
| **DT-14** | 🟡 | **El clonado es síncrono** (60 s de límite de transacción) y `catalog.status` siempre es `ready`; el `202 processing` del contrato no existe | Con 1 marco tarda unos segundos | Cola/trabajo en segundo plano cuando haya más marcos o catálogos más grandes |
| **DT-15** | 🟡 | **El nombre único del servicio por empresa lo impone la aplicación**, no un índice de la base (una carrera extrema podría duplicarlo) | Evitar otra migración en ese momento | Índice único sobre `(organization_id, lower(name))` |
| **DT-16** | 🟡 | **`evaluation_period` = trimestre natural de la contratación** (`2026-Q4`) | El brain da el formato, no la regla | Confirmar con el comité cómo se define el periodo |
| **DT-17** | 🟡 | `TRUST_CRITERION_REQUIRED` del contrato **no se usa** (el servidor añade `security` en vez de rechazar). `FRAMEWORK_NOT_CONTRACTED` sí, desde D47 | Decisión de diseño más amable con el cliente | Retirarlo del contrato o implementarlo |

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-26** | 🟠 | **Los marcos se contratan solo al registrar la empresa.** No hay forma de añadir, pausar o cancelar un marco **después** (ni endpoint ni pantalla), ni historial del contrato. Una empresa que ya existía antes de la migración 26 **no tiene contrato** y no podría declarar servicios (no se rellenó hacia atrás: no había datos) | Hoy solo existe SOC 2 (los otros seis se ofrecen pero no se pueden contratar, D50) | `PATCH` / pantalla de «Marcos» en Monkey Admin cuando haya un segundo marco (Fase 1) y una regla para el histórico |
| **DT-27** | 🟡 | **El contrato guarda solo el marco y la fecha** (sin vigencia, precio ni condiciones comerciales) y se contrata la **versión vigente** del marco al registrar | El brain no define el contrato comercial | Definirlo con el comité si el contrato debe llevar más |
| **DT-37** | 🟠 | **El límite de intentos con la clave de acceso vive en la memoria de la instancia.** 10 fallos por dirección cada 15 min, compartido por `redeem/lookup` y `redeem`; con varias réplicas el tope real es por réplica y se reinicia al reiniciar. Tras un proxy, `req.ip` es el del proxy salvo que se configure `trust proxy` | No hay Redis ni un limitador común en el backend | Un limitador compartido (Redis o la base) para todos los endpoints públicos, y revisar `trust proxy` en el despliegue |
| **DT-38** | 🟠 | **Las categorías de cada marco siguen siendo las 5 de SOC 2.** El comité confirmó (opción 2, D50) que cada marco use sus categorías nativas (ISO 27001: 4 temas; PCI DSS: 12 requisitos; NIST CSF: 6 funciones…), pero `requirements.trust_criterion_id` es una FK a `trust_criteria` (enum de los 5 TSC) y `service_trust_criteria` filtra con ellas. Hoy no estorba porque solo SOC 2 está construido | Sin segundo marco construido, migrar el modelo sería un cambio grande sin uso | Al sembrar el primer marco que no sea SOC 2: generalizar `trust_criteria` a **dominios por marco** (`framework_id`, `code`, `name`, `is_mandatory`) y `service_trust_criteria` a `service_framework_domains`. Mientras tanto, la pantalla pregunta por «categorías de SOC 2» |
| **DT-39** | 🔴 | **El adaptador de almacenamiento (S3 / minio) no se ha probado contra un minio real.** El código está (`FileStorage`, `S3FileStorage`, `UnavailableFileStorage`) y compila, y la lógica de validación se probó aparte, pero no se ha subido un objeto de verdad: se desconoce si el stack `minio` de la VPS está arriba, su endpoint, su bucket y si hay credenciales. Sin `S3_*` la subida responde 503 y se usa el enlace | Faltan los datos de acceso al minio | Datos del minio (endpoint, bucket, usuario de solo ese bucket), `S3_*` en el `.env` y un recorrido real de subir / descargar / reemplazar / eliminar. Política de bucket por empresa (`<empresa>/…`) y cifrado en reposo |
| **DT-40** | 🟡 | **La lista de 18 normas de protección de datos la depuró desarrollo, no el comité.** Salió PCI DSS y entraron la Ley 21.719 (CL), y las de UY, EC, PA y CR; las leyes con su vigencia están verificadas en fuentes públicas pero no se contrastaron con el Excel del comité | El comité pidió depurar la lista y delegó la investigación | Que el comité ratifique la lista. Mientras tanto, empresas que marcaron PCI DSS perdieron esa marca (la migración la borró) |
| **DT-41** | 🟡 | **«Contactar a mercadeo» es un mock.** El modal de un marco no contratado (Monkey Platform) invita a hablar con mercadeo, pero el botón solo cierra el modal: no hay formulario, correo ni registro de interés | El comité pidió un mock por ahora | Un canal real (formulario que llegue a ventas, con la empresa y el marco de interés) |
| **DT-42** | 🟡 | **Los textos «auditoría» de Inicio y de «Mis servicios» no se cambiaron a «consultoría».** El comité pidió el cambio en la pantalla del marco y del servicio; `home` y `services-list` aún dicen «auditoría» | Fuera de lo pedido | Una pasada de textos con el comité |

## Componente 1 — Contexto Organizacional (D44)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-18** | 🟡 | **Sin guardado parcial en el servidor.** El avance vive en `localStorage` del navegador; el formulario se envía completo al final | Columnas `NOT NULL` | Volver opcionales las columnas y mover la validación de completitud a la aplicación, si el comité quiere borradores |
| **DT-19** | 🟡 | **`business_model` trae 19 de «40+»**; «Otra» regulación no tiene campo de texto | P6 / el modelo no tiene dónde guardarlo | Lista completa del comité |
