# Decisiones — Onboarding · Contexto del servicio

Por qué este componente es como es. Lo vigente está en [`arquitectura/onboarding/contexto-servicio/`](../../../arquitectura/onboarding/contexto-servicio/README.md). Índice del módulo: [`README.md`](README.md).

## D45 · Componente 2 del onboarding: ajustes del schema y huecos resueltos por desarrollo

> ⚠️ **Parcialmente revertida por D51 (2026-10-05):** `service_regulations` (la regulación por servicio) se eliminó, y la
> Descripción del Sistema ya no es solo un enlace. Lo demás sigue vigente.

**Decisiones** (Carlos, 2026-09-30; **pendientes de ratificar con el comité**; ninguna toca cómo se
calcula el cumplimiento). Son los huecos que `contracts/onboarding/contexto-servicio.md` dejaba abiertos o que el
schema contradecía:

**Cambios de schema** (migración 24, `service_context_optional_fields_and_regulations`):

1. **`services.deployment_scenario` pasa a nullable.** El contrato dice que se captura en el
   Componente 3, pero la columna era `NOT NULL`: era imposible declarar el servicio antes de conectar la
   infraestructura.
2. **`subservice_organizations.provider`, `service_provided` y `responsibility` pasan a nullable.** El
   "detalle" del Excel es opcional y solo el `type` es obligatorio (el contrato ya lo decía).
3. ~~**Nueva tabla `service_regulations`**~~ **Revertida por D51** (la tabla se eliminó: la regulación se declara solo a nivel de empresa). Antes: servicio ↔ regulación, con RLS por `tenant_id`. Cerraba la
   pregunta abierta "regulación a nivel de servicio": el request del contrato ya traía
   `regulation_codes` y no tenía dónde persistir. No se puntúa (D10).

**Reglas del clonado** (lo que MD-80 / D36 dejaban sin precisar). **Superadas por D40** (Héctor, el
motor `CloneCatalogService`, que es el que corre): al fusionar `develop` se adoptó su versión. Lo que
cambia frente a lo escrito aquí: `source_ref` es `vanta:<código>`; las dimensiones y los vínculos con
pruebas **sí se clonan** (D39 sembró `control_dimensions`, ya no hay controles todos `manual`); con
solo `security` salen 79 controles. Se conservan de esta decisión la idempotencia, el no pisar y la
transacción única (puntos 8 y 9):

4. **Qué controles se clonan:** los ligados, por punto de enfoque, a requisitos del marco **cuyo criterio
   de confianza contrató el servicio** (contratar solo `security` no trae los de privacidad). Es lo que
   cuenta `applicable_requirements`. Con los 3 criterios `security + availability + confidentiality`
   salen 38 requisitos y 86 controles; con los 5, 61 y 118.
5. **Qué se clona del control:** `own_code` = código del catálogo (`CAP-1`); `client_interpretation`
   parte como la descripción del catálogo (el cliente la reescribe); `source_ref` = código de
   origen; `type` se deriva de sus dimensiones (una sola clase → esa; mezcla → `hybrid`; sin
   dimensiones → `manual`).
6. **Riesgos y causas:** se clonan **todos** los riesgos activos y todas las causas del catálogo (no se
   filtran por criterio: el criterio de un riesgo es de otra lista, §3.3), con sus relaciones; la
   relación causa ↔ control solo entre controles que el servicio sí clonó.
7. **Evidencia:** `validity_within_period` = el `evaluation_period` del marco (`AAAA-Tn`, trimestre de la
   contratación); `responsible_id` vacío (D30).
8. **El clonado es idempotente y nunca pisa:** repetirlo (al ampliar criterios con `PATCH`) solo añade lo
   que falta. Quitar criterios o un marco **no borra** nada: el marco pasa a `paused`.
9. **Es síncrono:** corre en la misma transacción que crea el servicio y el `201` ya trae
   `catalog.status = ready`. Tarda unos segundos contra la base remota (por eso `withScope` acepta un
   timeout mayor); el `processing` / `202` del contrato queda para cuando el volumen lo pida.

**Resto de huecos:**

10. **Descripción del Sistema: solo enlace** — **superado por D51** (ahora enlace y/o archivo). Antes: `kind = link`, `http`/`https`. El archivo
    (`multipart`, 25 MB) no se construyó: no hay dónde guardar binarios todavía. `kind = file` responde 422.
11. **Nombre único por empresa** sin importar mayúsculas ni espacios (`SERVICE_NAME_TAKEN`); la base no lo
    impone, la aplicación sí.
12. **`DELETE` con historia:** además de evaluaciones, bloquean la eliminación las **evidencias entregadas
    y los planes de acción** (todo trabajo del cliente). `409 SERVICE_HAS_EVALUATIONS`.
13. **(Superado por D47: `FRAMEWORK_NOT_CONTRACTED` ya se usa.)** **`FRAMEWORK_NOT_CONTRACTED` no se usa:** no existe una contratación de marcos a nivel de empresa en el
    modelo (los marcos se contratan por servicio, §6.1). Un código que no esté en `catalog.frameworks`
    responde 422 (`enum.invalid`); hoy solo existe `soc2` (D37).
14. **`PUT csocs` / `PUT cuecs` no se construyeron:** salen de las secciones 7 y 8 de la Descripción del
    Sistema, que aún no se procesa.
15. **Progreso (`/auth/me`):** `service_context` entra en `completed_steps` cuando existe al menos un
    servicio con un marco activo y su Descripción del Sistema; entonces `next_step` es `technical_control`.
16. **Presentación:** asistente de 6 pantallas más una de revisión (Tu servicio · Tus clientes · Datos y
    alcance · Marco · Proveedores · Cumplimiento), como el Componente 1. Una ficha de proveedor por tipo.

**Deja abierto:** `control_dimensions` está vacío en el catálogo (P10), así que hoy **todos los controles
clonados quedan `manual`** y sin dimensiones; el clonado ya las copia cuando se siembren.

**Por qué:** el brain define los 16 campos y la forma de la API, pero no estas decisiones de detalle; en
vez de dejar el sprint detenido se tomó el camino que no cambia el modelo de medición y se deja aquí para
revisión.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

---

## D51 · Correcciones al Componente 2 y a la activación de cuenta (2026-10-05)

**Decisión** (comité, confirmada por Carlos). Revierte parte de D45 y D43:

1. **Activación en dos pasos y sin nombre.** El primer paso pide solo el código y, al comprobarlo
   (`POST /v1/auth/redeem/lookup`), muestra la razón social y el correo que Monkey Admin ya fijó; el segundo pide solo la
   contraseña y su confirmación. El administrador se identifica por su correo: **`users.name` y `users.last_name` pasan a
   ser opcionales** y `redeem` ya no los recibe. El nuevo endpoint es público y revela razón social y correo a quien tenga el
   código, así que tiene un freno de 10 fallos / 15 min por dirección compartido con el canje (DT-37); antes, `redeem` no tenía
   ninguno.
2. **La regulación ya no se declara por servicio.** Las leyes de protección de datos aplican a la **empresa**, y ya se declaran
   en el Componente 1 (`organization_regulations`). Se retira `service_regulations` (misma migración `20261005220000`), `regulation_codes` del
   servicio y su pregunta. Revierte D45 (que la había añadido «por analogía»). Quedan 12 campos obligatorios.
3. **La lista de regulaciones solo trae normas de protección de datos.** Salió PCI DSS (estándar de la industria de tarjetas,
   no una ley; ya es un marco). HIPAA y GLBA se quedan: son leyes sectoriales de EE. UU. que protegen datos de salud y
   financieros. Entraron la Ley 21.719 de Chile (vigente desde el 1-dic-2026, reemplaza a la 19.628) y las de Uruguay (18.331),
   Ecuador (LOPDP), Panamá (Ley 81) y Costa Rica (8968): 18 en total. La migración borra la marca PCI DSS de las empresas que la
   habían elegido. **Falta que el comité ratifique la lista** (DT-40).
4. **Descripción del Sistema: enlace, archivo, o los dos.** `system_descriptions.file_path` se reemplaza por `link_url` y
   `file_key` (ambos opcionales, `CHECK` de que haya al menos uno). El archivo (PDF o .docx, 25 MB, validado por extensión y por
   firma) se guarda en S3 / minio detrás del puerto `FileStorage`; sin `S3_*` la app arranca y la subida responde 503. Como el
   archivo necesita el servicio, `system_description` pasa a ser **opcional al crear**: con archivo se crea el servicio y
   luego se sube. La llave del objeto nunca sale; se baja con un enlace temporal de 5 minutos. Se borra el objeto al reemplazarlo
   y al eliminar el servicio. **No está probado contra el minio real** (DT-39).
5. **El nombre del proveedor ya no se pregunta** (el tipo —AWS, Azure…— ya lo dice). `subservice_organizations.provider`
   sigue existiendo y opcional; hoy no se captura.
6. **Certificación previa:** pasa de 4 a 8 valores (SOC 2, SOC 1, ISO 27001, PCI DSS, HIPAA, NIST CSF, GDPR, ninguna), preguntando
   por una «certificación o evaluación» porque algunos no se certifican como tal.

**Por qué:** el comité revisó el onboarding con el producto delante y pidió estos ajustes; ninguno contradice una regla del modelo
(el control sigue siendo atómico, el cumplimiento se sigue derivando).

**Fuente:** correcciones del comité del 2026-10-05, pasadas por Carlos el mismo día.

---

---

## D89 · El onboarding es solo el contexto de la empresa; los servicios se declaran después y sus riesgos se evalúan antes de declarar activos (2026-10-23)

**Decisión.**
1. **El onboarding termina con el Componente 1** (contexto de la empresa). Declarar servicios (Componente 2) y conectar activos (Componente 3) **dejan de ser pasos del onboarding**: el cliente los hace cuando quiera, desde «Mis servicios» o desde Cumplimiento. Con el contexto de la empresa declarado, «Inicio» lo da por onboardeado.
2. **Cumplimiento sin servicios** dice «No hay servicios creados. Para medir tu cumplimiento en un servicio, primero crea un servicio», con un enlace al mismo alta que «Mis servicios» (`/services/new`). «Inicio» invita igual.
3. **Declarar un servicio es una cadena en una sola pantalla: crear → evaluar sus riesgos → declarar sus activos.** Al guardar el servicio se clona el catálogo del marco como hasta hoy (riesgos, causas y controles son **propios de cada servicio**) y **la misma pantalla de crear el servicio sigue con un asistente que evalúa los riesgos uno a uno**, sin llevar al usuario a Cumplimiento. Por cada riesgo, dos preguntas de **1 a 5**, en lenguaje claro y con las escalas del comité (hoja `Riesgos` del Excel, ver `contracts/cumplimiento/riesgos.md`): **¿qué tan probable es que ocurra en tu servicio?** (Raro · Improbable · Posible · Probable · Casi seguro) y **si ocurriera, ¿qué tan grave sería el impacto?** (Insignificante · Menor · Moderado · Mayor · Crítico). El servidor calcula el valor y el nivel (`POST /v1/risks/{id}/evaluation`, sin cambios). Quien interrumpe puede retomarlo desde el detalle del servicio, con el **mismo asistente**, que empieza por el primer riesgo sin evaluar. La pestaña **Riesgos de Cumplimiento queda para ver y corregir** esas calificaciones después; ahí no se hace la evaluación inicial.
4. **No se declaran los activos de un servicio hasta evaluar sus riesgos vigentes.** Mientras falte alguno: «Nueva conexión» queda cerrada con el motivo y el avance («faltan 4 de 10») y un botón que abre el asistente; las rutas de conexión (`/services/:id/connections/new…`) mandan al detalle del servicio, que abre el asistente. Un servicio sin riesgos vigentes no se bloquea. **Lo que ya está conectado no cambia**: el candado aplica a conexiones nuevas.5. **Es una guía de la pantalla, no una barrera.** El Backend todavía no lo exige: quien llame a la API puede crear el activo igual (`DT-77`). Se construyó primero en Frontend para verlo funcionar; el candado del Backend (`409 RISKS_NOT_EVALUATED` al crear una conexión o asignar activos) queda para después.
6. `GET /v1/auth/me` **no cambia**: sigue listando `organizational_context`, `service_context` y `technical_control`. Platform solo mira si el primero está completo.

**Por qué.** Los riesgos, las causas y los controles son de cada servicio, y su probabilidad e impacto cambian de un servicio a otro; si el cliente declara activos antes de evaluarlos, el cumplimiento y la matriz se miden sobre un servicio al que le falta lo básico. Y obligar a declarar un servicio para terminar el onboarding era pedirle trabajo (y conexiones) que aún no puede hacer.

**Lo que no cambia.** D23 (Cumplimiento no es un 4º componente del onboarding: sigue siendo un módulo aparte), D60 (no hay «cuántos tienes» declarado), D67 (marketplace de plataformas) y la clonación automática del catálogo al declarar el servicio. **Evaluar los riesgos no desbloquea el riesgo residual**: eso espera el efecto de cada relación causa→control (`P22`, MD-151).

**Ajusta D23 y reemplaza a D69:** D23 decía que el cumplimiento no bloqueaba nada; ahora evaluar los riesgos bloquea **declarar activos** (no usar el producto). D69 (que el control técnico se completara con el escenario) deja de aplicar porque el paso ya no es del onboarding.

**Qué cambia.** `arquitectura/onboarding/README.md`, `producto/flujo-end-to-end.md`, `context/frontend.md`, `DT-77` (nueva). Sin migración ni cambio de API.

**Fuente:** Carlos Castaño, 2026-10-23 (responsable de producto).

---

---

## D93 · Al evaluar los riesgos de un servicio nuevo se puede retirar el que no aplica, con un motivo (2026-10-25; amplía D89)

**Decisión.**
1. **El asistente de riesgos del alta del servicio (D89) deja retirar un riesgo.** Cada paso tiene, junto a las dos preguntas de 1 a 5, «Este riesgo no aplica a mi servicio». Pide un motivo de al menos tres letras y, al confirmar, da de baja ese riesgo (`DELETE /v1/risks/{id}` con `reason`) y pasa al siguiente. Un riesgo retirado no cuenta como pendiente: «faltan N» se calcula con los vigentes (D89, punto 4).
2. **Retirar un riesgo no retira nada más.** Las causas son compartidas (en el catálogo SOC 2, 30 de 46 causas sirven a dos o más riesgos) y un control lo exige un requisito del marco aunque su riesgo ya no esté. El porcentaje de cumplimiento no pasa por los riesgos (§9). Una causa que queda sin ningún riesgo sigue existiendo.
3. **Lo decide el `admin_empresa` solo, con motivo.** Acompañar el alta del servicio con un consultor es lo normal, pero los permisos por pantalla siguen abiertos (`P3`) y hoy todo lo hace el administrador; no se introduce aprobación del consultor para riesgos. Los controles siguen siendo propuestas que aprueba el consultor (D65).
4. **El motivo no tiene columna:** queda en el rastro de auditoría de la baja (`after_state.retirement_reason`). La API lo deja opcional.
5. **Volver a incluir un riesgo retirado.** El asistente lista los retirados con «Volver a incluir» (`POST /v1/risks/{id}/reactivation`, conserva su evaluación). Así retirar nunca es definitivo mientras se arma el servicio.
6. **Agregar un riesgo propio con sus causas, dentro del asistente.** «Agregar un riesgo» abre el mismo formulario de Cumplimiento (nombre, descripción, criterio, pérdidas posibles) y, al guardarlo, pasa a elegir sus causas: las del servicio con una lista que se busca, o una causa nueva (`POST /v1/services/{id}/causes`) que queda ligada al riesgo. Las causas son opcionales; el riesgo nuevo entra a la cola de los pendientes y se califica como cualquier otro.
7. **Pantalla.** El asistente ocupa todo el ancho: a la izquierda la lista de riesgos (con su estado, los retirados y «Agregar un riesgo»); a la derecha, el riesgo, las dos preguntas con escalas compactas y la vista previa del nivel con su casilla en la matriz.
8. **Fuera de esta decisión, a propósito:** revisar las causas de los riesgos del catálogo y retirar controles al crear el servicio (su baja nace de los requisitos, no de las causas). Cuando haya IA, será ella quien proponga qué riesgos, causas y controles usar según el contexto de la empresa y del servicio.

**Por qué.** Los riesgos del catálogo se clonan completos (D40) y no todos aplican a todos los servicios; obligar a calificar uno que no corresponde ensucia la matriz con respuestas inventadas. Pedir el motivo es lo que un auditor exige cuando algo sale del alcance.

**Qué cambia.** `contracts/cumplimiento/riesgos.md` (`DELETE /v1/risks/{id}` con motivo y `POST /v1/risks/{id}/reactivation`), el asistente de riesgos de Platform. Sin migración.

**Fuente:** Carlos Castaño, 2026-10-25 (responsable de producto).
