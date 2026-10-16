# Deuda técnica — Onboarding

Parches de los Componentes 1 y 2 del onboarding y del registro de empresa. Contexto: [`README.md`](README.md).

## Componente 2 — Contexto del Servicio (D45)

### DT-12 · Descripción del Sistema: el archivo se guarda (D51) pero no se procesa

🟠 Importante

- **Qué está parchado:** No se leen las 10 secciones AICPA (`sections` queda vacío) y por eso **no existen `PUT csocs` / `PUT cuecs`**. La carga de archivo (multipart, 25 MB, PDF/docx) ya existe y se probó contra un S3 compatible, no contra el minio de la VPS (DT-39)
- **Por qué:** Falta el procesamiento del documento
- **Qué lo cierra:** Procesar el documento (IA) y sembrar `sections`, `csocs` y `cuecs`

### DT-14 · El clonado es síncrono

🟡 Mejora

- **Qué está parchado:** (60 s de límite de transacción) y `catalog.status` siempre es `ready`; el `202 processing` del contrato no existe
- **Por qué:** Con 1 marco tarda unos segundos
- **Qué lo cierra:** Cola/trabajo en segundo plano cuando haya más marcos o catálogos más grandes

### DT-15 · El nombre único del servicio por empresa lo impone la aplicación

🟡 Mejora

- **Qué está parchado:** , no un índice de la base (una carrera extrema podría duplicarlo)
- **Por qué:** Evitar otra migración en ese momento
- **Qué lo cierra:** Índice único sobre `(organization_id, lower(name))`

### DT-16 · `evaluation_period` = trimestre natural de la contratación

🟡 Mejora

- **Qué está parchado:** (`2026-Q4`)
- **Por qué:** El brain da el formato, no la regla
- **Qué lo cierra:** Confirmar con el comité cómo se define el periodo

### DT-17 · `TRUST_CRITERION_REQUIRED` del contrato no se usa

🟡 Mejora

- **Qué está parchado:** `TRUST_CRITERION_REQUIRED` del contrato **no se usa** (el servidor añade `security` en vez de rechazar). `FRAMEWORK_NOT_CONTRACTED` sí, desde D47
- **Por qué:** Decisión de diseño más amable con el cliente
- **Qué lo cierra:** Retirarlo del contrato o implementarlo


## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

### DT-26 · Los marcos se contratan solo al registrar la empresa

🟠 Importante

- **Qué está parchado:** No hay forma de añadir, pausar o cancelar un marco **después** (ni endpoint ni pantalla), ni historial del contrato. Una empresa que ya existía antes de la migración 26 **no tiene contrato** y no podría declarar servicios (no se rellenó hacia atrás: no había datos)
- **Por qué:** Hoy solo existe SOC 2 (los otros seis se ofrecen pero no se pueden contratar, D50)
- **Qué lo cierra:** `PATCH` / pantalla de «Marcos» en Monkey Admin cuando haya un segundo marco (Fase 1) y una regla para el histórico

### DT-27 · El contrato guarda solo el marco y la fecha

🟡 Mejora

- **Qué está parchado:** (sin vigencia, precio ni condiciones comerciales) y se contrata la **versión vigente** del marco al registrar
- **Por qué:** El brain no define el contrato comercial
- **Qué lo cierra:** Definirlo con el comité si el contrato debe llevar más

### DT-37 · El límite de intentos con la clave de acceso vive en la memoria de la instancia

🟠 Importante

- **Qué está parchado:** 10 fallos por dirección cada 15 min, compartido por `redeem/lookup` y `redeem`; con varias réplicas el tope real es por réplica y se reinicia al reiniciar. Tras un proxy, `req.ip` es el del proxy salvo que se configure `trust proxy`
- **Por qué:** No hay Redis ni un limitador común en el backend
- **Qué lo cierra:** Un limitador compartido (Redis o la base) para todos los endpoints públicos, y revisar `trust proxy` en el despliegue

### DT-38 · Las categorías de cada marco siguen siendo las 5 de SOC 2

🟠 Importante

- **Qué está parchado:** El comité confirmó (opción 2, D50) que cada marco use sus categorías nativas (ISO 27001: 4 temas; PCI DSS: 12 requisitos; NIST CSF: 6 funciones…), pero `requirements.trust_criterion_id` es una FK a `trust_criteria` (enum de los 5 TSC) y `service_trust_criteria` filtra con ellas. Hoy no estorba porque solo SOC 2 está construido
- **Por qué:** Sin segundo marco construido, migrar el modelo sería un cambio grande sin uso
- **Qué lo cierra:** Al sembrar el primer marco que no sea SOC 2: generalizar `trust_criteria` a **dominios por marco** (`framework_id`, `code`, `name`, `is_mandatory`) y `service_trust_criteria` a `service_framework_domains`. Mientras tanto, la pantalla pregunta por «categorías de SOC 2»

### DT-39 · El adaptador de almacenamiento (S3 / minio) no se ha probado contra el minio de la VPS

🔴 Crítica

- **Qué está parchado:** *2026-10-16 (MD-110):* el adaptador ya se probó de punta a punta contra un servidor S3 compatible con credenciales (SeaweedFS, porque MinIO dejó de publicar imágenes en Docker Hub): un PDF de 25 MB se sube por la API y se descarga idéntico con su enlace firmado, sin firma el acceso responde 403, y un enlace de 2 segundos vence. Esa prueba encontró y cerró un error de un byte (un archivo de exactamente 25 MB recibía 413). **Lo que sigue sin probarse** es el MinIO de la VPS: se desconoce si el stack `minio` está arriba con un bucket de evidencias y una cuenta de servicio limitada a él, y falta la ruta pública en `nginx_proxy_manager`. Sin `S3_*` la subida responde 503 y se usa el enlace; `check-env.sh` avisa si faltan.
- **Por qué:** faltan los datos de acceso del MinIO de la VPS y la ruta pública del proxy, que solo existen en el servidor.
- **Qué lo cierra:** el recorrido de `Backend/scripts/deploy/setup-storage.sh` y `npm run storage:smoke` **en el servidor** (§8 de `schema-implementacion.md`): bucket privado, cuenta de servicio de solo ese bucket, `S3_*` y `S3_PUBLIC_ENDPOINT` en el `.env`, y el límite de 25 MB en el proxy. Después, política de bucket por empresa (`<empresa>/…`) y cifrado en reposo. Ticket: MD-110.

### DT-40 · La lista de 18 normas de protección de datos la depuró desarrollo, no el comité

🟡 Mejora

- **Qué está parchado:** Salió PCI DSS y entraron la Ley 21.719 (CL), y las de UY, EC, PA y CR; las leyes con su vigencia están verificadas en fuentes públicas pero no se contrastaron con el Excel del comité
- **Por qué:** El comité pidió depurar la lista y delegó la investigación
- **Qué lo cierra:** Que el comité ratifique la lista. Mientras tanto, empresas que marcaron PCI DSS perdieron esa marca (la migración la borró)

### DT-41 · «Contactar a mercadeo» es un mock

🟡 Mejora

- **Qué está parchado:** El modal de un marco no contratado (Monkey Platform) invita a hablar con mercadeo, pero el botón solo cierra el modal: no hay formulario, correo ni registro de interés
- **Por qué:** El comité pidió un mock por ahora
- **Qué lo cierra:** Un canal real (formulario que llegue a ventas, con la empresa y el marco de interés)

### DT-42 · Los textos «auditoría» de Inicio y de «Mis servicios» no se cambiaron a «consultoría»

🟡 Mejora

- **Qué está parchado:** El comité pidió el cambio en la pantalla del marco y del servicio; `home` y `services-list` aún dicen «auditoría»
- **Por qué:** Fuera de lo pedido
- **Qué lo cierra:** Una pasada de textos con el comité


## Componente 1 — Contexto Organizacional (D44)

### DT-18 · Sin guardado parcial en el servidor

🟡 Mejora

- **Qué está parchado:** El avance vive en `localStorage` del navegador; el formulario se envía completo al final
- **Por qué:** Columnas `NOT NULL`
- **Qué lo cierra:** Volver opcionales las columnas y mover la validación de completitud a la aplicación, si el comité quiere borradores

