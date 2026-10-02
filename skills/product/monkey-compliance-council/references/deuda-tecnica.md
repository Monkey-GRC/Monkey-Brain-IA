# Deuda técnica — lo que está parchado y hay que revisar

Aquí vive lo que **se construyó a medias, con un supuesto o con un atajo** para no detener el
sprint, y que debe volver a revisarse. No es una lista de errores: cada fila es una decisión
consciente con su razón, su riesgo y qué la cierra.

**Cómo se distingue de los otros documentos**

| Documento | Qué guarda |
|---|---|
| `modelo-datos-decisiones.md` | Lo que **ya se decidió** y por qué (incluye cómo se cubrió cada hueco: D43 a D46) |
| `modelo-datos-pendientes.md` | Preguntas de producto que **solo el comité o Nelson pueden responder** |
| **este archivo** | Parches de **desarrollo**: lo que funciona hoy pero no es la forma definitiva |

**Reglas:** una fila se **borra** cuando se cierra (deja constancia en el commit o en la decisión que
la cierra). Los ID (`DT-n`) no se reutilizan. Si una fila depende del comité, enlaza su pregunta en
`modelo-datos-pendientes.md` o pídela ahí: no se resuelve por cuenta propia.

**Severidad:** 🔴 puede causar daño o engaño si se ignora · 🟠 limita el producto o el equipo ·
🟡 mejora pendiente.

---

## Componente 3 — Control Técnico (D46)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-1** | 🔴 | **La sonda es simulada o no está disponible.** No existen conectores productivos: `PROBE_MODE=simulated` da por buena una conexión con credenciales completas (y nunca la marca `operational`: queda `warning`); sin él, `validate` responde `503 CONNECTION_UNAVAILABLE` | El sprint entrega el flujo y la UI, no la integración (`onboarding-technical-control.md`) | Un adaptador real de `ConnectionProbe` (sin tocar los casos de uso) y retirar las etiquetas de «modo demostración». Mientras tanto el backend **se niega a arrancar** con `simulated` en producción |
| **DT-2** | 🟠 | **«n/18» y `checks_available` son constantes** (18/18 y 402). Nadie ha definido cuáles son las 18 capacidades técnicas, y `catalog.checks` tiene 0 filas | El contrato las nombra sin listarlas | Que el comité entregue las 18 y se siembren los checks; la cobertura pasa a calcularse |
| **DT-3** | 🟠 | **`ac_04` a `ac_06` se completaron por analogía** con sus equivalentes en nube (método, permisos, evidencia generada); la evidencia de `ac_02`/`ac_03` también la redactó desarrollo | El brain solo da la ficha completa de `ac_01` a `ac_03` | Revisión del comité; ajustar el seed (`prisma/seed/reference/data.ts`; los datos de Héctor coinciden con los míos, así que el contenido es el mismo y sigue pendiente de revisión) |
| **DT-4** | 🟠 | **Credenciales por conexión definidas por desarrollo** (`account_id` + `read_only_role`; `db_user` + `db_password`; SSH o agente). No hay instalador del agente: «instalar el agente de Monkey» es una promesa sin entrega, y el cliente no recibe instrucciones | El contrato muestra un solo ejemplo (SSH) | Definir con el equipo de la sonda qué pide cada conexión y cómo se entrega el agente (token de enrolamiento, instrucciones, expiración) |
| **DT-5** | 🟠 | **Llave de cifrado en el `.env`.** `CREDENTIALS_ENCRYPTION_KEY` (AES-256-GCM) no tiene rotación ni gestor de secretos; el formato `v1.` deja espacio para versionar la llave, pero no hay procedimiento | Alcance del sprint | Gestor de secretos / KMS en producción y un procedimiento de rotación (re-cifrar con `v2`) |
| **DT-6** | 🟡 | **Scope declarado frente a dimensiones.** Los 5 contadores (`server`, `cloud`, `app`, `database`, `endpoint`) no son las 5 dimensiones del modelo; se tratan como un **eje distinto** («lo que dices que tienes») | Pregunta abierta del contrato | Confirmación del comité; si no, cambiar `scopes` |
| **DT-7** | 🟡 | **«Híbrido» ofrece las 6 conexiones** y el cliente usa las que le sirvan | El contrato dice «combinación de los anteriores» | Ratificar con el comité |
| **DT-8** | 🟡 | **El tipo del activo se deduce de la conexión.** `network_device` y `documentation` no tienen forma de darse de alta (ninguna conexión los produce) | Evita preguntar dos veces | Decidir cómo se inventarían esos tipos |
| **DT-9** | 🟠 | **`responsible_id` se acepta en la API pero no hay forma de crear cargos** (`organization_responsibles`): ni endpoint ni pantalla. La UI lo oculta | El Módulo de Usuarios no existe | Módulo de Usuarios / Cumplimiento |
| **DT-10** | 🟠 | **La UI promete «te avisaremos» cuando la evaluación automática esté disponible, y no existe ningún aviso** (ni correo ni notificación) | Mensaje honesto para el modo `unavailable` | Construir las notificaciones **o** reescribir el mensaje. No dejar la promesa sin mecanismo |
| **DT-11** | 🟡 | **Sin editar ni eliminar un activo**; `GET /v1/assets/{id}` se añadió fuera del contrato | El contrato no los define | Módulo de Cumplimiento |

## Paso 3 del control técnico: el modelo de conexión (D48)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-31** | 🔴 | **El formulario de «Conectar mi primer sistema» pide credenciales que el modelo real no usa.** En la sonda real el cliente instala un agente y Monkey lee la base/API del manager; no hay rol de lectura, usuario de base ni llave SSH que entregar a Monkey | Se construyó antes de verificar la sonda (D46, DT-4) | Rediseñar el paso 3 (P12): sin credenciales, mostrar el comando de instalación del agente y el estado «esperando al agente» |
| **DT-32** | 🔴 | **No hay vínculo activo ↔ agente.** `assets` no sabe qué agente de la sonda es, así que no hay forma real de «validar» una conexión ni de leer resultados | Depende de DT-31 | Campo o tabla de enlace y un adaptador real de `ConnectionProbe` que lea la sonda en **solo lectura** |
| **DT-33** | 🔴 | **Aislamiento entre empresas sin imponer.** Clave de inscripción global y grupo autodeclarado por el agente: sin una regla de Monkey, un agente podría caer en otra empresa | Es una propiedad de la sonda, no de Monkey | Decidir con el equipo de la sonda cómo se asigna cada empresa a su grupo y validar la pertenencia al sincronizar |
| **DT-34** | 🟠 | **Cobertura honesta de plataformas.** Hoy hay pruebas para Ubuntu 22.04, Ubuntu 14.04 y Windows 11; la pantalla ofrece más tipos de sistema | La UI nació del contrato, no de la cobertura | Mostrar qué sistemas tienen evaluación real y marcar el resto «próximamente» |
| **DT-35** | 🟠 | **Conexión a la nube diferida.** El modelo de rol entre cuentas / federación de identidad sin contraseñas (como en AWS, GCP, Azure) no está decidido y las integraciones de la sonda son solo de registros | Decisión de arquitectura | Decidir el modelo con el comité; mientras tanto `ac_01` queda «próximamente» |
| **DT-36** | 🟠 | **El `.env` de pruebas usa el superusuario de la base de la sonda y un usuario de API con permisos amplios** | Se puso para investigar | Pedir un usuario de base **solo lectura** y un rol de API de solo lectura por grupo; autorizar la IP de desarrollo en la API si se quiere probar |

## Componente 2 — Contexto del Servicio (D45)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-12** | 🟠 | **Descripción del Sistema: solo enlace.** No hay carga de archivo (multipart, 25 MB, PDF/docx), no se procesan las 10 secciones AICPA (`sections` queda vacío) y por eso **no existen `PUT csocs` / `PUT cuecs`** | No hay dónde guardar binarios todavía | Almacenamiento de archivos + procesamiento del documento |
| ~~DT-13~~ | ✅ | ~~Controles clonados `manual` y sin dimensiones~~ **Cerrada:** Héctor sembró `control_dimensions` (D39) y su clonado (D40) las copia | | |
| **DT-14** | 🟡 | **El clonado es síncrono** (60 s de límite de transacción) y `catalog.status` siempre es `ready`; el `202 processing` del contrato no existe | Con 1 marco tarda unos segundos | Cola/trabajo en segundo plano cuando haya más marcos o catálogos más grandes |
| **DT-15** | 🟡 | **El nombre único del servicio por empresa lo impone la aplicación**, no un índice de la base (una carrera extrema podría duplicarlo) | Evitar otra migración en ese momento | Índice único sobre `(organization_id, lower(name))` |
| **DT-16** | 🟡 | **`evaluation_period` = trimestre natural de la contratación** (`2026-Q4`) | El brain da el formato, no la regla | Confirmar con el comité cómo se define el periodo |
| **DT-17** | 🟡 | `TRUST_CRITERION_REQUIRED` del contrato **no se usa** (el servidor añade `security` en vez de rechazar). `FRAMEWORK_NOT_CONTRACTED` sí, desde D47 | Decisión de diseño más amable con el cliente | Retirarlo del contrato o implementarlo |

## Registro de empresa y contrato de marcos (D47)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-26** | 🟠 | **Los marcos se contratan solo al registrar la empresa.** No hay forma de añadir, pausar o cancelar un marco **después** (ni endpoint ni pantalla), ni historial del contrato. Una empresa que ya existía antes de la migración 26 **no tiene contrato** y no podría declarar servicios (no se rellenó hacia atrás: no había datos) | Hoy solo existe SOC 2 y el registro lo fija | `PATCH` / pantalla de «Marcos» en Monkey Admin cuando haya un segundo marco (Fase 1) y una regla para el histórico |
| **DT-27** | 🟡 | **El contrato guarda solo el marco y la fecha** (sin vigencia, precio ni condiciones comerciales) y se contrata la **versión vigente** del marco al registrar | El brain no define el contrato comercial | Definirlo con el comité si el contrato debe llevar más |

## Componente 1 — Contexto Organizacional (D44)

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-18** | 🟡 | **Sin guardado parcial en el servidor.** El avance vive en `localStorage` del navegador; el formulario se envía completo al final | Columnas `NOT NULL` | Volver opcionales las columnas y mover la validación de completitud a la aplicación, si el comité quiere borradores |
| **DT-19** | 🟡 | **`business_model` trae 19 de «40+»**; «Otra» regulación no tiene campo de texto | P6 / el modelo no tiene dónde guardarlo | Lista completa del comité |

## Transversal

| ID | | Qué está parchado | Por qué | Qué lo cierra |
|---|---|---|---|---|
| **DT-20** | 🔴 | **Las pruebas automáticas no están en los repositorios.** Se hicieron como scripts de recorrido (API y navegador) fuera de `Backend/` y `Frontend-Platform/`: no corren en CI y se pueden perder | Velocidad del sprint | Llevarlas a `Backend/test` (e2e con jest/supertest) y a un recorrido con Playwright, y correrlas en CI |
| **DT-21** | 🟠 | **Traducciones al inglés hechas por desarrollo** y sin revisar; Monkey Platform no tiene i18n (todo en español) | El Excel solo trae español | Revisión del comité; instalar i18n en Platform |
| **DT-22** | 🟠 | **Base de datos dedicada → «no disponible»**; sin regenerar clave ni editar empresa | P2(b)(c)(d) | Respuestas del comité y el aprovisionamiento |
| **DT-23** | 🟠 | **Sin MFA** (MD-94) | Fuera del alcance de MD-64 | Su propio ticket |
| **DT-28** | 🟠 | **La auditoría de login, canje y registro de empresa se escribe después de la acción, no en la misma transacción** (regla de D41 / convención del audit). Si falla entre ambas, la acción queda sin rastro | Los casos de uso llaman al repositorio y luego al `AuditLogWriter` | Pasar el escritor de auditoría dentro de la transacción del repositorio (login, canje, registro, servicios, activos) |
| **DT-29** | 🟡 | **`auth.login_failed` se guarda con `tenant_id` nulo** (no se sabe de qué empresa es un intento fallido hasta autenticar) y los nombres de acción siguen `<recurso>.<verbo>` salvo este | El email inexistente no identifica empresa | Decidir con Héctor si se resuelve el tenant por email cuando existe |
| **DT-30** | 🟡 | **Las pruebas de jest no corren en máquinas Windows sin el runtime de Visual C++** (jest 30 carga un resolvedor nativo; da «Module ts-jest … was not found»). Se validaron con un runner mínimo | Dependencia del entorno | Documentar el requisito (VC++ Redistributable) o fijar un resolvedor sin binario nativo |
| **DT-24** | 🟡 | Tailwind avisa de clases canónicas (`dark:bg-white/[0.03]` → `dark:bg-white/3`) en Platform | Solo estético | Una pasada de limpieza |

## Funcionalidad que el brain menciona y aún no tiene contrato

| ID | | Qué | Nota |
|---|---|---|---|
| **DT-25** | 🟠 | **Ver el catálogo maestro SOC 2 en Monkey Admin y poder crear un control, riesgo o causa nuevos.** El principio está en `modelo-datos.md` §3 y D9/D31, pero no hay contrato, pantallas ni épico | Primero un contrato en `contracts/modules/` (qué campos, cómo se vincula un control nuevo, cuándo se publica la versión, A4) |
