# Catálogo maestro · historias de usuario

> **VF18 (D128): estas historias y sus cifras (119 controles, 61 pruebas) describen el catálogo v1 construido.** La VF18 trae el catálogo v2 (D129): ver [`datos/decisiones/catalogo-maestro/`](../../datos/decisiones/catalogo-maestro/README.md).

Responde: **¿qué necesita cada persona para leer las opciones que salen del catálogo, y qué necesita el equipo de Monkey
para mantener los marcos, controles, pruebas, riesgos, causas y evidencias sin romper lo que ya usan las empresas, y
cómo se comprueba que lo tiene?** Cada historia dice quién, qué y para qué; sus criterios de aceptación son verificables
y citan la regla que los fija. El detalle técnico (cuerpos, errores) está en el
[contrato](../../../../../../contracts/catalogo-maestro.md) y en los
[enums](../../../../../../contracts/enums.md); la secuencia, en [`03-flujos.md`](03-flujos.md); qué exige cada marco, en
[`marcos/`](marcos/README.md); los pasos de cada caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Roles** (D96): `admin_monkey` (Monkey Admin) cura el catálogo; `admin_empresa` lee los marcos que puede usar;
«Persona» = cualquier usuario con sesión, que solo ve opciones de formularios, nunca el catálogo crudo. La carga inicial
la corre el **equipo de Monkey** con un script, sin usuario humano (D35); no es una pantalla. **Estado** de cada
historia: ✅ construida · 🟡 parcial · ⚪ por construir.

`P21` (logos de marcas de terceros) está registrada en este módulo, pero lo que bloquea es publicar el marketplace del
[onboarding](../onboarding/README.md) con logos: no tiene historia aquí.

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-CAT-01 | Ver las opciones de un formulario con su etiqueta en mi idioma | Persona | ✅ | `enums.md`, `404` |
| HU-CAT-02 | Ver los marcos que Monkey ofrece y elegir solo los contratados | `admin_empresa` | 🟡 | D37, D47, D50, DT-41 |
| HU-CAT-03 | Consultar el catálogo maestro en Monkey Admin | `admin_monkey` | ✅ | D31, SEG-06, `FORBIDDEN`, `NOT_FOUND` |
| HU-CAT-04 | Encontrar los controles sin evidencia requerida o sin requisito | `admin_monkey` | ✅ | contrato (filtros) |
| HU-CAT-05 | Crear y editar controles, riesgos, causas, pruebas y evidencias requeridas | `admin_monkey` | ✅ | SEG-36, `CODE_ALREADY_EXISTS`, `VALIDATION_FAILED` |
| HU-CAT-06 | Que lo que ve el cliente de una prueba nunca nombre al proveedor | `admin_monkey` | ✅ | D70, D82, SEG-39, `text.names_provider` |
| HU-CAT-07 | Dar de baja y reactivar una pieza sin borrarla | `admin_monkey` | ✅ | D28, SEG-36, `CATALOG_ITEM_IN_USE` |
| HU-CAT-08 | Vincular y desvincular piezas del catálogo | `admin_monkey` | ✅ | `LINK_ALREADY_EXISTS`, `CATALOG_ITEM_IN_USE`, SEG-36 |
| HU-CAT-09 | Que solo `admin_monkey` pueda cambiar el catálogo | `admin_monkey` | ✅ | D31, SEG-06, `FORBIDDEN` |
| HU-CAT-10 | Cargar el catálogo del comité sin adivinar nada | Equipo de Monkey | 🟡 | D35, D38, D39, D68, P9, DT-69 |
| HU-CAT-11 | Reconciliar el Excel nuevo del comité con lo cambiado desde Monkey Admin | Equipo de Monkey | ✅ | D35, SEG-36 |
| HU-CAT-12 | Que mi empresa no cambie cuando Monkey cambia el catálogo | `admin_empresa` | ✅ | D28, D36, D40 |
| HU-CAT-13 | Publicar una versión del catálogo y propagarla a las empresas | `admin_monkey` | ⚪ | A4, §3.5 |
| HU-CAT-14 | Aceptar o no un cambio que altera cómo se mide | `admin_empresa` | ⚪ | A4, D96 |
| HU-CAT-15 | Activar un marco nuevo mapeando, sin reconstruir controles | `admin_monkey` | ⚪ | D37, D50, D56, DT-38 |
| HU-CAT-16 | Ver el contenido del catálogo en mi idioma | Persona | 🟡 | DT-100, DT-21 |

---

### HU-CAT-01 · Ver las opciones de un formulario con su etiqueta en mi idioma

**Como** persona con sesión, **quiero** que cada lista de opciones de un formulario venga del servidor con su etiqueta
traducida **para** no ver opciones viejas ni en otro idioma cuando el comité cambia una lista.

- Dado un nombre de lista conocido, `GET /v1/catalogs/{name}` responde `200` con pares `value` (snake_case estable) y
  `label` traducida según `Accept-Language`, en el orden del enum (`contracts/enums.md`, «Qué listas sirve»).
- Las listas fijas salen de `common/catalogs/onboarding-catalogs.ts`; regulaciones y marcos, del schema `catalog`
  ([`03-flujos.md`](03-flujos.md) §1).
- Un nombre que no existe → `404`.
- Ningún frontend (Platform ni Monkey Admin) escribe una lista a mano: los selects y filtros del Admin también la piden
  aquí (contrato, «Listas de opciones del Admin»).
- Las opciones no llevan datos de ninguna empresa: las lee cualquier rol con sesión.

### HU-CAT-02 · Ver los marcos que Monkey ofrece y elegir solo los contratados

> 🟡 **Parcial:** la lista y el bloqueo existen; «hablar con mercadeo» es un mock (DT-41).

**Como** `admin_empresa`, **quiero** ver todos los marcos que Monkey ofrece y elegir solo los que contrató mi empresa
**para** saber qué puedo medir hoy y qué podría sumar.

- `GET /v1/catalogs/frameworks` trae los 7 marcos ofrecidos (SOC 2, ISO 27001, HIPAA, GDPR, PCI DSS, NIST CSF y SOC 1,
  en orden de demanda) con su `availability`; hoy solo SOC 2 es `available` (D37, D50).
- `GET /v1/catalogs/contracted-frameworks` trae solo los que Monkey Admin contrató para mi empresa; solo lo pide
  `admin_empresa` (D47).
- Al declarar un servicio solo se elige un marco contratado; otro → `FRAMEWORK_NOT_CONTRACTED` (D47).
- Si toco un marco no contratado no se selecciona: se abre un aviso que invita a hablar con mercadeo (D50 punto 1); el
  botón solo cierra el aviso, sin registrar el interés (DT-41).
- CIS Controls no se ofrece como marco contratable (vetado, [`marcos/`](marcos/README.md)).

### HU-CAT-03 · Consultar el catálogo maestro en Monkey Admin

**Como** `admin_monkey`, **quiero** ver los marcos y, dentro de cada uno, sus requisitos, controles, riesgos, causas,
pruebas y evidencias requeridas **para** saber qué mide Monkey y encontrar huecos.

- La entrada «Catálogo maestro» (ruta `/catalog`) muestra los marcos como tarjetas con sus conteos de requisitos,
  controles y pruebas; en SOC 2, 118 controles vinculados de los 119 del catálogo (CPL-1 no cuelga de ningún requisito).
- Cinco pestañas (controles, riesgos, causas, pruebas, evidencias requeridas), paginadas, con búsqueda y filtros de
  origen (`committee` · `monkey_admin`) y estado (`is_active`).
- El detalle de un control trae descripción, `source_ref`, puntos de enfoque (con su `id`), dimensiones, pruebas,
  evidencias requeridas en orden, políticas y las causas que lo mitigan.
- El detalle de una prueba separa lo que ve el cliente (`display_name`, `display_description`) de los textos internos
  del comité (D70, D82).
- Los riesgos y las causas son un pool global, no de un marco: «los riesgos de un marco» se deriva de sus controles
  (contrato, «Cómo está armado el catálogo»).
- Un elemento que no existe → `404 NOT_FOUND`.

### HU-CAT-04 · Encontrar los controles sin evidencia requerida o sin requisito

**Como** `admin_monkey`, **quiero** filtrar los controles que no piden evidencia o que no cuelgan de ningún requisito
**para** ver los huecos reales del catálogo antes de cargar el siguiente Excel.

- `has_evidence_template=false` lista los controles sin evidencia requerida (52 en SOC 2 según el contrato).
- `GET /v1/catalog/controls?unlinked=true` lista los controles que no cuelgan de ningún requisito: CPL-1 y cualquiera
  recién creado sin vincular, para que no desaparezca de la vista del marco.
- Los controles de un marco se filtran también por `search`, `domain`, `requirement_code` e `is_active`.

### HU-CAT-05 · Crear y editar controles, riesgos, causas, pruebas y evidencias requeridas

**Como** `admin_monkey`, **quiero** agregar y corregir piezas del catálogo desde Monkey Admin **para** no depender de una
recarga del Excel para un ajuste puntual.

- Todo lo creado nace `origin: monkey_admin` y activo; responde `201` con el elemento.
- Un control nace **sin requisito** hasta vincularlo a un punto de enfoque; sin `code`, un riesgo recibe el siguiente
  `R0NN` y una causa el siguiente `F0NN`; una plantilla de evidencia nace con dimensión `policy` si no se indica.
- El prefijo del código de una prueba dice su dimensión (`T-DOC`, `T-SRV`, `T-BD`, `T-APP`, `T-CLD`); si no coincide →
  `422 code.dimension_mismatch`.
- Un `code` repetido dentro de su tipo → `409 CODE_ALREADY_EXISTS`; un campo obligatorio o un enum inválido →
  `422 VALIDATION_FAILED`; un `PATCH` sin ningún campo → `422`.
- Editar solo manda lo que cambió y responde `200`; el código y la dimensión de una prueba no se editan.
- Una fila del comité editada desde Admin conserva `origin: committee` (contrato, «Preguntas abiertas», decidido el
  2026-10-17).
- Cada escritura deja su rastro `catalog.*` (por ejemplo `catalog.control.create`) en la misma transacción (SEG-36).
- Un elemento recién creado se abre para vincularlo (HU-CAT-08).

### HU-CAT-06 · Que lo que ve el cliente de una prueba nunca nombre al proveedor

**Como** `admin_monkey`, **quiero** que el sistema rechace un nombre o una descripción de prueba que nombre al proveedor
de la sonda **para** no filtrar un dato confidencial del producto a un cliente.

- `display_name` y `display_description` que nombran al proveedor → `422 text.names_provider`, al crear y al editar
  (SEG-39, D70).
- La misma regla la valida `catalog:load` al cargar el Excel (D82).
- La descripción que ve el cliente es el objetivo del comité tal cual; solo se reescribe cuando ese objetivo nombra al
  proveedor (D82).
- Los demás textos del comité (herramienta, limitaciones, paso a paso, criterio) los ve solo `admin_monkey` (D70).

### HU-CAT-07 · Dar de baja y reactivar una pieza sin borrarla

**Como** `admin_monkey`, **quiero** dar de baja un control, riesgo, causa, prueba o evidencia requerida, y reactivarlo
**para** retirarlo de lo que se ofrece sin romper las copias de las empresas ni su histórico.

- `DELETE` y `PATCH { "is_active": false }` hacen lo mismo: baja lógica, idempotente; la fila no se borra (contrato,
  «Escritura de elementos»).
- `PATCH { "is_active": true }` reactiva.
- Monkey Admin pide confirmación antes de dar de baja.
- Dar de baja **la única prueba** de un control activo → `409 CATALOG_ITEM_IN_USE`.
- Lo dado de baja deja de ofrecerse a los servicios nuevos (el clonado lo salta) y no cambia las copias que las empresas
  ya clonaron (D28).
- Deja `catalog.<pieza>.deactivate` o `reactivate` en la misma transacción (SEG-36).

### HU-CAT-08 · Vincular y desvincular piezas del catálogo

**Como** `admin_monkey`, **quiero** vincular un control a puntos de enfoque, pruebas, evidencias requeridas y
dimensiones, y una causa a riesgos y controles **para** que un control entre a un marco y se pueda medir.

- Vincular un control a un punto de enfoque es lo que lo hace entrar a un marco.
- Un vínculo repetido → `409 LINK_ALREADY_EXISTS`; `POST` responde `201` con el padre actualizado y `DELETE` responde
  `204` y borra solo la relación, nunca los elementos.
- Una prueba solo se vincula a un control que tenga su dimensión → `422 dimension.not_in_control`; el selector solo
  ofrece pruebas de las dimensiones del control.
- Las evidencias requeridas de un control quedan numeradas de 1 sin huecos: insertar en medio corre las siguientes y
  quitar una cierra el hueco; una posición fuera de rango → `422 sequence.range`.
- Desvincular la única prueba de un control activo, o quitar una dimensión de la que el control todavía usa pruebas →
  `409 CATALOG_ITEM_IN_USE`.
- El selector busca solo entre lo activo y deja fuera lo ya vinculado; causa ↔ riesgo se vincula desde cualquiera de los
  dos lados.
- Cada vínculo y desvínculo deja su rastro (`catalog.control_test.link`…) en la misma transacción (SEG-36).

### HU-CAT-09 · Que solo `admin_monkey` pueda cambiar el catálogo

**Como** `admin_monkey`, **quiero** que nadie más pueda leer el catálogo crudo ni escribirlo **para** que lo que Monkey
mide sea igual para todos los clientes y nadie lo altere.

- Toda ruta `/v1/catalog/…` con un rol distinto de `admin_monkey` → `403 FORBIDDEN`.
- En la base, el schema `catalog` es global (sin `tenant_id`) y su RLS es solo de escritura: cualquiera lo lee, solo
  `admin_monkey` lo modifica (D31, SEG-06).
- Cualquier `admin_monkey` puede editar; un rol propio de editor de catálogo sería una decisión nueva (contrato,
  «Preguntas abiertas»).

### HU-CAT-10 · Cargar el catálogo del comité sin adivinar nada

> 🟡 **Parcial:** la carga de SOC 2 funciona; la dimensión Aplicación y diez causas dependen de `P9`, abierta, y las
> dimensiones por control no coinciden con las del comité (DT-69).

**Como** equipo de Monkey, **quiero** cargar el catálogo desde el Excel del comité con un script reproducible **para**
que lo que mide Monkey sea exactamente lo que el comité entregó.

- `npm run reference:load` siembra regulaciones, los marcos ofrecidos (los seis `coming_soon` sin requisitos ni
  controles) y las capacidades automáticas; `npm run catalog:load` siembra SOC 2 desde un JSON versionado con el sha256
  del Excel de origen (D35, D50).
- La carga valida antes de escribir, inserta en una sola transacción, solo agrega lo que falta, aborta con diff si una
  fila existente difiere y no borra nada; correrla dos veces no duplica (D35).
- La versión 1 la publica el script, sin usuario humano, y lo dice en `change_summary` (D35).
- Las cifras se comprueban contra los datos crudos: 119 controles, 729 relaciones punto de enfoque ↔ control, 61
  pruebas, 50 plantillas de evidencia; si el Excel cambia, la extracción falla hasta actualizarlas a conciencia (D38).
- `catalog:verify` y `reference:verify` solo comparan, no escriben.
- ⚪ Las pruebas de la dimensión Aplicación (`T-APP-001…006`) y las diez causas sin riesgo se cargan tal cual, sin
  equiparar ni asociar, hasta que el comité responda (`P9`).
- 🟡 Qué dimensiones exige cada control las define el comité en `Controles Monkey` (D68); hoy se derivaron de las
  pruebas (D39) y no coinciden (DT-69).

### HU-CAT-11 · Reconciliar el Excel nuevo del comité con lo cambiado desde Monkey Admin

**Como** equipo de Monkey, **quiero** que la carga del Excel nuevo distinga lo del comité de lo agregado o editado
desde Monkey Admin **para** decidir con el comité qué versión queda sin perder ningún cambio.

- `catalog:load` y `catalog:verify` solo miran filas `origin = committee`; lo agregado desde Admin y sus vínculos se
  ignoran y se cuentan aparte («Ignoradas…») (contrato, «Seed y auditoría»).
- Una fila del comité editada desde Admin aparece como conflicto, marcada «[editado desde Monkey Admin]» gracias al
  rastro `catalog.*.update|deactivate|reactivate` (SEG-36); el seed nunca la sobrescribe (D35).

### HU-CAT-12 · Que mi empresa no cambie cuando Monkey cambia el catálogo

**Como** `admin_empresa`, **quiero** que mis controles, riesgos, causas y evidencias sean una copia propia **para** que
un cambio del catálogo no mueva mi cumplimiento sin que yo lo sepa.

- Al contratar un marco en un servicio se clonan controles, dimensiones, vínculos con pruebas, evidencias requeridas,
  riesgos y causas; requisitos, puntos de enfoque y pruebas se referencian, no se copian (D28, D36, §3.5).
- El clonado corre en la misma transacción que contrata el marco y no pisa lo que el servicio ya personalizó (D40).
- Lo que `admin_monkey` agrega, edita o da de baja no llega a los servicios que ya clonaron (D28; contrato,
  «Preguntas abiertas»).

### HU-CAT-13 · Publicar una versión del catálogo y propagarla a las empresas

> ⚪ **Por construir:** fuera de la entrega del contrato («Por construir: la propagación… y la versión que se
> publica»).

**Como** `admin_monkey`, **quiero** publicar una versión numerada del catálogo **para** que un cambio llegue a las
empresas de forma controlada y cada medición diga contra qué versión se hizo.

- `catalog_versions` numera cada publicación y cada fila de `evaluations` guarda contra qué versión se midió (A4).
- Una corrección de redacción o un control nuevo se propagan solos; cambiar cómo se mide un control, eliminarlo o
  cambiar la procedencia o confianza del mapeo de un check requiere aceptación (§3.5).
- Un control nuevo entra a contar desde el siguiente periodo de evaluación: el número del periodo en curso no se toca
  (§3.5).

### HU-CAT-14 · Aceptar o no un cambio que altera cómo se mide

> ⚪ **Por construir** (A4); depende de HU-CAT-13.

**Como** `admin_empresa`, **quiero** decidir si acepto un cambio del catálogo que altera cómo se mide **para** que mi
número no cambie sin mi consentimiento.

- Los cambios de la columna «Requiere aceptación» de §3.5 quedan pendientes hasta que el `admin_empresa` los acepta
  (D96).
- `catalog_versions` guarda si cada cambio se propagó solo o quedó pendiente de aceptación, y `service_frameworks` desde
  qué periodo aplica cada versión (§3.5).

### HU-CAT-15 · Activar un marco nuevo mapeando, sin reconstruir controles

> ⚪ **Por construir:** solo SOC 2 está construido (D37); el siguiente marco espera el mapeo del comité y DT-38.

**Como** `admin_monkey`, **quiero** activar un marco que hoy se ofrece bloqueado **para** que las empresas lo contraten
y se mida con los controles que ya existen.

- Activar es cargar sus requisitos y puntos de enfoque y vincularlos a los controles existentes; solo se crean
  controles nuevos si son realmente distintos (regla 4 de `CLAUDE.md`; contrato, «Cómo está armado el catálogo»).
- Cada marco usa sus categorías nativas (ISO 27001: 4 temas; PCI DSS: 12 requisitos; NIST CSF: 6 funciones) (D50
  punto 4); antes hay que generalizar `trust_criteria` a dominios por marco (DT-38).
- El marco pasa de `coming_soon` a `available` y desde ahí Monkey Admin deja contratarlo (D50).
- Lo que un motor trae etiquetado de fábrica es un insumo; gana el mapeo del comité (D56).
- El conocimiento de cada marco, con fuente y fecha, está en [`marcos/`](marcos/README.md); escribirlo no lo activa.

### HU-CAT-16 · Ver el contenido del catálogo en mi idioma

> 🟡 **Parcial:** las etiquetas de las listas sí se traducen (HU-CAT-01); el contenido del catálogo solo está en español
> (DT-100).

**Como** persona con la aplicación en inglés, **quiero** ver controles, requisitos, riesgos, causas y evidencias en mi
idioma **para** entender qué se me pide sin traducirlo yo.

- ✅ Las 11 pruebas de nube tienen nombre en inglés (`display_name_en`), escrito por desarrollo y sin revisar (DT-100,
  DT-21).
- ⚪ El resto del contenido del comité se sirve según `Accept-Language` con su procedencia, y el comité revisa el inglés
  (DT-100: MD-212).
