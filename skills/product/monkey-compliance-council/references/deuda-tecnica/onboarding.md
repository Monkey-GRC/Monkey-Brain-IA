# Deuda técnica — Onboarding

Parches vigentes de [Onboarding](../arquitectura/onboarding/README.md). Tablero y reglas: [`README.md`](README.md).

## Componente 3 — Control Técnico (D46)

### DT-3 · `ac_04` a `ac_06` se completaron por analogía

🟠 Importante

- **Qué está parchado:** con sus equivalentes en nube (método, permisos, evidencia generada); la evidencia de `ac_02`/`ac_03` también la redactó desarrollo
- **Por qué:** El brain solo da la ficha completa de `ac_01` a `ac_03`
- **Qué lo cierra:** Revisión del comité; ajustar el seed (`prisma/seed/reference/data.ts`; los datos de Héctor coinciden con los míos, así que el contenido es el mismo y sigue pendiente de revisión)

### DT-4 · Credenciales por conexión definidas por desarrollo

🟠 Importante

- **Qué está parchado:** (`account_id` + `read_only_role`; `db_user` + `db_password`; SSH o agente). No hay instalador del agente: «instalar el agente de Monkey» es una promesa sin entrega, y el cliente no recibe instrucciones
- **Por qué:** El contrato muestra un solo ejemplo (SSH)
- **Qué lo cierra:** Definir con el equipo de la sonda qué pide cada conexión y cómo se entrega el agente (token de enrolamiento, instrucciones, expiración)

### DT-7 · «Híbrido» ofrece las 6 conexiones

🟡 Mejora

- **Qué está parchado:** y el cliente usa las que le sirvan
- **Por qué:** El contrato dice «combinación de los anteriores»
- **Qué lo cierra:** Ratificar con el comité

### DT-8 · El tipo del activo se deduce de la conexión

🟡 Mejora

- **Qué está parchado:** `network_device` y `documentation` no tienen forma de darse de alta (ninguna conexión los produce)
- **Por qué:** Evita preguntar dos veces
- **Qué lo cierra:** Decidir cómo se inventarían esos tipos

### DT-9 · `responsible_id` se acepta en la API pero no hay forma de crear cargos

🟠 Importante

- **Qué está parchado:** (`organization_responsibles`): ni endpoint ni pantalla. La UI lo oculta
- **Por qué:** El Módulo de Usuarios no existe
- **Qué lo cierra:** Módulo de Usuarios / Cumplimiento

### DT-11 · Un activo dado de baja no se puede ver ni restaurar

🟡 Mejora

- **Qué está parchado:** *2026-10-09: editar (`PATCH`) y dar de baja (`DELETE`) ya existen para los activos; `GET /v1/assets/{id}` se añadió fuera del contrato.* **La baja no borra** (conserva el historial) y **no hay forma de restaurar** un sistema dado de baja ni de verlos
- **Por qué:** Hasta ahora nadie lo pedía
- **Qué lo cierra:** Pantalla de sistemas dados de baja, cuando el comité diga si se restauran

## Paso 3 del control técnico: el modelo de conexión (D48)

### DT-35 · Conexión a la nube diferida

🟠 Importante

- **Qué está parchado:** El modelo de rol entre cuentas / federación de identidad sin contraseñas (como en AWS, GCP, Azure) no está decidido y las integraciones de la sonda son solo de registros. **2026-10-07:** una prueba con el motor de nube (Prowler, D100) y un usuario con llaves estáticas funcionó, pero no es el modelo definitivo (ver DT-43 a DT-45 y P14 C)
- **Por qué:** Decisión de arquitectura
- **Qué lo cierra:** Decidir el modelo de credenciales (P14 C; el rol de cada motor ya lo cerró D100); mientras tanto `ac_01` queda «próximamente»

## Flujo de conexión de la nube (D58)

### DT-55 · La plantilla del rol se descarga y se crea a mano

🟡 Mejora

- **Qué está parchado:** El enlace de «un clic» de CloudFormation exige que la plantilla esté en un bucket de S3
- **Por qué:** Hace falta una cuenta y un bucket públicos de solo lectura; no vale la pena para la demo
- **Qué lo cierra:** Publicar la plantilla en S3 y devolver `launch_url` en `connection_setup`

### DT-63 · Un activo descubierto no se puede editar

🟠 Importante

- **Qué está parchado:** (criticidad, responsable, nombre): `PATCH /v1/assets/{id}` solo atiende conexiones y nace en «Media» sin responsable
- **Por qué:** D61 llegó sin la edición del activo hijo
- **Qué lo cierra:** Endpoint para editar el activo descubierto (criticidad y responsable, sin tocar lo que lee la nube) y su pantalla

## Marketplace de plataformas (D67)

### DT-81 · El escenario de despliegue ya no se pregunta, pero su columna y sus tablas siguen en la base

🟡 Mejora

- **Qué está parchado:** D92 retiró la pregunta «dónde vive tu servicio» y todo el código que la usaba, pero `services.deployment_scenario`, la tabla `catalog.deployment_scenario_capabilities`, su siembra en `reference:load` y el enum `tenant.deployment_scenario` siguen en la base y en el schema de Prisma, sin ningún uso.
- **Por qué:** quitarlos es una migración destructiva (`DROP COLUMN`, `DROP TABLE`, `DROP TYPE`) sobre la base compartida y pierde los valores que algunos servicios ya declararon. Se hace aparte, cuando el comité haya ratificado D92: si lo rechazara, el escenario se restituye sin recargar nada.
- **Qué lo cierra:** una migración que borre la columna, la tabla y el enum; quitar `deployment_scenario_capabilities` de `seed-reference.ts` y de `reference/data.ts`, y borrar `DEPLOYMENT_SCENARIO` de los modelos de Prisma. Al cerrarla, bórrese esta entrada.

## Componente 2 — Contexto del Servicio (D45)

### DT-12 · Descripción del Sistema: el archivo se guarda (D51) pero no se procesa

🟠 Importante

- **Qué está parchado:** No se leen las 10 secciones AICPA (`sections` queda vacío) y por eso **no existen `PUT csocs` / `PUT cuecs`**. La carga de archivo (multipart, 25 MB, PDF/docx) ya existe y se probó contra un S3 compatible y contra el minio de la VPS (MD-110)
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

## Componente 1 — Contexto Organizacional (D44)

### DT-18 · Sin guardado parcial en el servidor

🟡 Mejora

- **Qué está parchado:** El avance vive en `localStorage` del navegador; el formulario se envía completo al final
- **Por qué:** Columnas `NOT NULL`
- **Qué lo cierra:** Volver opcionales las columnas y mover la validación de completitud a la aplicación, si el comité quiere borradores

## Transversal

### DT-77 · Evaluar los riesgos antes de declarar activos se exige solo en la pantalla

🟠 Importante

- **Qué está parchado:** D89 pide evaluar los riesgos de un servicio antes de declarar sus activos, pero solo lo imponen la pantalla (el asistente del alta, el botón «Nueva conexión» cerrado y un guard en las rutas de conexión de Platform). Además, **los textos de las escalas de 1 a 5 viven en las traducciones de Platform** (copiados del Excel; el inglés lo tradujo desarrollo, `DT-21`), no en una lista que sirva el Backend. El Backend no lo comprueba: quien llame a `POST /v1/assets` o a `PUT /v1/services/:id/connections/:connectionId/assets` puede declarar activos con riesgos sin evaluar.
- **Por qué:** se construyó primero en Frontend para verlo funcionar y ajustar la regla antes de fijarla en la API; el Backend exige tocar las e2e que crean un servicio y un activo de seguidas.
- **Qué lo cierra:** `409 RISKS_NOT_EVALUATED` al crear una conexión o asignar activos a un servicio con riesgos vigentes sin probabilidad o impacto. Debe aplicar solo a conexiones **nuevas** (los servicios que ya tienen activos no se tocan) y la regla de «cuántos faltan» (`riskProgress` en Platform) debe vivir en un solo sitio. Contrato: `contracts/onboarding/conexion-activos/README.md`.

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-82 · La lista de servicios lee cada servicio por separado y solo aguanta porque se alargó el tiempo de la transacción

🟠 Importante

- **Qué está parchado:** `GET /v1/services` lee los servicios de uno en uno dentro de una sola transacción, y cada lectura son varias consultas seguidas (criterios, marcos, proveedores, conexiones y dos conteos). Contra la base remota (~100 ms por consulta) unos cuantos servicios pasaban de los 5 s de Prisma y la lista (y el detalle) respondían 500 con `P2028`. Se subió el límite de esas dos lecturas a 30 s.
- **Por qué:** es lo mínimo que lo arregla sin reescribir la lectura; el costo crece con el número de servicios y con la latencia a la base.
- **Qué lo cierra:** leer la página entera en pocas consultas (los conteos de requisitos y controles con un `groupBy` para todos los servicios de la página, y las relaciones con un solo `findMany`), de modo que el tiempo no dependa de cuántos servicios haya. Al cerrarla, bórrese esta entrada y `READ_TRANSACTION`.
