# Decisiones — Onboarding · Contexto organizacional

Por qué este componente es como es. Lo vigente está en [`arquitectura/onboarding/contexto-organizacional/`](../../../arquitectura/onboarding/contexto-organizacional/README.md). Índice del módulo: [`README.md`](README.md).

## D30 · Cargos, clonado de evidencia y de tests (cierra P4)

**Decisión:** el cargo vive en `organization_responsibles` (escenario del cliente), no en un
catálogo global: `evidence_requirements.responsible_id` apunta ahí y el requisito se clona con el
responsable vacío. `evidence_requirements` gana `source_ref`. `tests` y `control_measurements`
**no se clonan** en el MVP: se referencian con FK.

**Por qué:** P4 preguntaba si se añadía un catálogo de cargos; el Backend ya había implementado la
segunda opción y funciona. Los tests y los pesos no los reescribe el cliente en el MVP (R-09), y
clonarlos solo duplicaba 61 tests por tenant. **Pendiente de ratificar con el comité**, aunque no
bloquea nada.

---

## D44 · Componente 1 del onboarding: huecos del contrato resueltos por desarrollo

**Decisiones** (Carlos, 2026-09-30; **pendientes de ratificar con el comité**, ninguna toca cómo se
calcula el cumplimiento). Son los huecos que el contrato de `contracts/onboarding/contexto-organizacional.md`
dejaba abiertos:

1. **Sin guardado parcial.** El contrato hablaba de un `PATCH` "mientras el cliente escribe", pero las
   columnas obligatorias de `organizations` son `NOT NULL` y no se podía guardar a medias. Se eligió no
   tocar el schema: el avance vive en el navegador del cliente (por usuario, sobrevive a la expiración
   de la sesión) y se envía completo con `PUT` al final. Si el comité quiere borradores en el servidor,
   se vuelven opcionales esas columnas y se mueve la validación de completitud a la aplicación.
2. **Un solo `PUT`** crea o actualiza. Se retira `ORGANIZATION_ALREADY_EXISTS`, que citaba un `POST`
   que el contrato nunca definió.
3. **«Ninguna» es excluyente; «Otra» queda solo marcada.** «Otra» no tiene campo de texto porque el
   modelo no tiene dónde guardar cuál es; se añade si el comité lo pide.
4. **`none` y `other` son filas de `catalog.regulations`** (jurisdicción `n/a`): la tabla puente
   referencia por FK, y guardar «Ninguna» deja constancia de que el cliente contestó que no le aplica
   ninguna, que no es lo mismo que no haber contestado.
5. **Etiquetas en inglés traducidas por desarrollo** (el Excel solo trae español, salvo `size`),
   pendientes de revisión. Platform todavía no tiene i18n: hoy se ve todo en español.
6. **Dos catálogos de países** (`incorporation_country` y `client_country`) en lugar del único
   `country` del contrato: son listas distintas (12 y 13) y el schema ya tiene dos enums.
7. **Pasos del onboarding en `/auth/me`:** `organizational_context`, `service_context`,
   `technical_control`; `next_step` es `null` cuando el cliente terminó los tres. Hoy solo se deriva el
   primero (existe la organización).
8. **Presentación:** asistente guiado de 5 pantallas cortas más una de revisión, en vez de 10
   pantallas de una pregunta. Es una lectura de `philosophy.md` ("una pregunta o acción clara por
   paso") que agrupa campos afines para no cansar; si el comité prefiere una pregunta por pantalla,
   es un cambio solo de frontend.

**Por qué:** el brain define los 10 campos, sus opciones y la forma de la API, pero no estas
decisiones de detalle; en vez de dejar el sprint detenido se tomó el camino que no cambia el modelo y
se deja aquí para revisión.

**Fuente:** confirmación de Carlos, 2026-09-30.

---

---

## D73 · La lista de modelos de negocio es de 19, más «otro» (cierra P6)

**Decisión.** `business_model` tiene **las 19 opciones del Excel del comité más `other`**. La cifra «40+» que repiten el modelo y el Excel se tiene por un texto sin respaldo en la hoja. Si el comité entrega más opciones, se agregan con una migración
y en `contracts/enums.md`, sin reabrir nada.

**Por qué.** La hoja es la fuente y lista 19; esperar una lista que quizá no exista bloquearía el catálogo para nada. Agregar un valor después es barato.

**Cierra** `P6` y la deuda `DT-19`.

**Fuente:** responsable de producto, 2026-10-10; hoja *Contexto Empresa* de la VF2.

---
