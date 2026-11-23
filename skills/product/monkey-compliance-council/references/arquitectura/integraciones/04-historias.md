# Integraciones · historias de usuario

Responde: **¿qué necesita cada persona para ver con qué plataformas de terceros trabaja su empresa, sumar una nueva y
entender qué aporta, y cómo se comprueba que lo tiene?** Cada historia dice quién, qué y para qué; sus criterios de
aceptación son verificables y citan la regla que los fija. El detalle técnico (cuerpos, errores) está en el
[contrato](../../../../../../contracts/integraciones.md); los pasos de cada caso, en [`05-casos-de-uso.md`](05-casos-de-uso.md).

**Roles** (D96): `admin_empresa` y `auditor` (Monkey Platform). `responsable`, `delegado` y `admin_monkey` no entran a
esta sección (D110 punto 5). **Estado** de cada historia: ✅ construida · 🟡 parcial · ⚪ por construir.

## Resumen

| ID | Historia | Rol | Estado | Reglas |
|---|---|---|---|---|
| HU-INT-01 | Ver las integraciones que mi empresa ya tiene, con su estado | `admin_empresa` · `auditor` | ✅ | D110, D57, D61, SEG-01 |
| HU-INT-02 | Enterarme de qué integración necesita atención y por qué conexión | `admin_empresa` · `auditor` | ✅ | D110, D57 |
| HU-INT-03 | Explorar el catálogo para agregar una integración | `admin_empresa` | ✅ | D110, D67 |
| HU-INT-04 | Conocer una integración antes de conectarla | `admin_empresa` | ✅ | D110, D58, SEG-48, SEG-50, SEG-01 |
| HU-INT-05 | Ver qué alimenta una integración en el cumplimiento | `admin_empresa` · `auditor` | ✅ | D56, D70, regla 4 |
| HU-INT-06 | Conectar una integración disponible a uno de mis servicios | `admin_empresa` | ✅ | D110, D89 |
| HU-INT-07 | Revisar como auditor solo lo que la empresa tiene conectado | `auditor` | ✅ | D110 punto 5 |
| HU-INT-08 | Saber qué integraciones vienen pronto, sin poder conectarlas aún | `admin_empresa` | ✅ | D110 punto 6, D67 |
| HU-INT-09 | Conectar la organización de GitHub de mi empresa | `admin_empresa` | ⚪ | P45, D129 |
| HU-INT-10 | Llevar el trabajo de cumplimiento a Jira | `admin_empresa` · `responsable` · `delegado` | ⚪ | D138, D144 |

**Fuera de las historias:** la interfaz única de conector (conectar, validar, credencial temporal, ejecutar, normalizar;
D110 punto 7) no es una capacidad que vea una persona: se construye con la primera integración nueva que se conecte de
verdad (HU-INT-09 o HU-INT-10). Conectar Azure, GCP, Microsoft 365 o Google Workspace es del flujo de conexión de cada
servicio ([Conexión de activos](../onboarding/conexion-activos/README.md)); aquí solo se muestran (HU-INT-08).

---

### HU-INT-01 · Ver las integraciones que mi empresa ya tiene, con su estado

**Como** administrador o auditor de la empresa, **quiero** ver en un solo lugar las plataformas de terceros con las que
mi empresa ya trabaja **para** saber qué está conectado y si funciona.

- Dado que la empresa tiene al menos una conexión vigente de una integración (`assets.status = active`, sin activo padre,
  D61), entonces esa integración aparece una vez, con su propósito, sus recursos reconocidos, su última validación y sus
  conexiones con los servicios a los que pertenecen.
- Una integración sin conexiones vigentes no aparece en la lista: está en el catálogo (D110 punto 3).
- El estado se **deriva** de las conexiones y no se guarda: `needs_attention` si alguna falló al validarse o está en
  error; si no, `active` si alguna está activa o programada; si no, `pending` (`integration_status`).
- La lista va ordenada `needs_attention`, `active`, `pending` y, dentro, por nombre; se puede buscar por nombre y filtrar
  por estado, con las opciones del catálogo `integration_status` (el frontend no tiene la lista en el código).
- `resource_count` cuenta solo lo reconocido en el último descubrimiento, con la misma regla que los recursos de una
  conexión.
- Una empresa nunca ve las conexiones de otra (SEG-01). `responsable` y `delegado` reciben `403`.
- Sin integraciones, el administrador ve cómo agregar una; el auditor, un mensaje sin acción.

### HU-INT-02 · Enterarme de qué integración necesita atención y por qué conexión

**Como** administrador o auditor, **quiero** que la lista me avise de las integraciones con un problema **para** saber
qué conexión revisar sin abrir cada una.

- Dado que una o más integraciones están en `needs_attention`, entonces arriba de la lista aparece un aviso con cuántas
  son, que se despliega para mostrar las conexiones afectadas (`needs_attention = true`).
- El texto habla de un **problema de conexión**, nunca de un incumplimiento ni de controles fallidos (D57).
- El administrador llega desde cada conexión a su detalle dentro del servicio; el auditor solo la lee.

### HU-INT-03 · Explorar el catálogo para agregar una integración

**Como** administrador, **quiero** ver todo lo que se puede conectar, agrupado por para qué sirve **para** elegir qué
sumar a mi empresa.

- El catálogo sale de la base (`catalog.integrations`, D110 punto 2), sin paginar; el frontend no tiene la lista en el
  código.
- Se agrupa por propósito, medición (`measurement`) antes que flujo de trabajo (`workflow`), y dentro por el orden del
  catálogo; los títulos de grupo salen del catálogo `integration_purpose`.
- Cada tarjeta muestra la marca tal cual (no se traduce), su logo, su descripción en mi idioma y si mi empresa ya la tiene
  conectada (`connected`).
- Si la integración tiene plataforma de conexión, su nombre, logo y disponibilidad son **los de la plataforma** (D67): si
  cambian allá, cambian aquí.
- Puedo buscar por nombre o descripción. Solo `admin_empresa`: el resto recibe `403`.

### HU-INT-04 · Conocer una integración antes de conectarla

**Como** administrador, **quiero** ver qué hace una integración, qué necesita, qué permisos pide y cómo protege Monkey la
conexión **para** decidir si la conecto y prepararme.

- El detalle vale igual para una integración disponible, conectada o próxima; lo que no aplica llega vacío y la pantalla
  lo explica (`GET /v1/integrations/{code}`).
- Pestañas: resumen (qué hace, qué puedo hacer, requisitos), conexiones (solo si la empresa tiene alguna), permisos, qué
  evalúa (HU-INT-05) y seguridad. La pestaña elegida queda en el enlace.
- Cada permiso dice su nombre, para qué es, su identificador técnico tal como lo veo en mi plataforma y si es de lectura o
  escritura (`integration_permission_access`).
- La seguridad lista **solo lo verificado** (un `SEG-n` en ✅ o una decisión construida), por tema
  (`integration_security_topic`): para AWS, solo lectura, credenciales temporales y identificador externo (D58),
  ejecución aislada (SEG-48), aislamiento entre empresas (SEG-01) y llaves cifradas (SEG-50). Nada de lo planificado.
- Ningún texto nombra al motor que evalúa (regla 1); todos llegan en mi idioma.
- Un código que no existe es `404 INTEGRATION_NOT_FOUND`.

### HU-INT-05 · Ver qué alimenta una integración en el cumplimiento

**Como** administrador o auditor, **quiero** ver qué pruebas automáticas alimenta una integración y a cuántos controles y
marcos llegan **para** entender su aporte al cumplimiento.

- `coverage` se **deriva del catálogo**: una prueba entra si tiene al menos un check de esa plataforma, con cualquier
  procedencia (D56); se cuentan los controles vinculados sin repetir, y por marco los que cubren uno de sus requisitos.
- El nombre de cada prueba es su nombre neutro en mi idioma (D70); si falta, el código.
- Sin checks cargados de esa plataforma, `coverage` es `null` y la pantalla lo dice.
- La pantalla dice que la integración **alimenta** esas pruebas, no que las aprueba: que un control cumpla lo decide el
  cálculo con todas sus pruebas y evidencias (regla 4, §9).

### HU-INT-06 · Conectar una integración disponible a uno de mis servicios

**Como** administrador, **quiero** conectar una integración desde su tarjeta o su detalle **para** empezar a evaluarla sin
buscar dónde se hace.

- La sección no conecta nada por sí misma: «Conectar» lleva al flujo de conexión del servicio que ya existe
  ([`conectar.md`](../../../../../../contracts/onboarding/conexion-activos/conectar.md)), con la categoría y la plataforma
  de la integración, y al terminar vuelve a donde estaba.
- Si llego desde la lista o el catálogo, primero elijo el servicio; si la empresa no tiene servicios, se me ofrece ir a
  «Mis servicios».
- Si llego desde la «Nueva conexión» de un servicio, ese servicio ya está elegido y no se pregunta.
- Si los riesgos del servicio no están evaluados, se me manda a evaluarlos antes de declarar activos (D89).
- El botón aparece solo para `admin_empresa` y solo si la integración está disponible (`available`).

### HU-INT-07 · Revisar como auditor solo lo que la empresa tiene conectado

**Como** auditor, **quiero** ver la lista y el detalle de las integraciones conectadas, en lectura, **para** revisar con
qué plataformas trabaja la empresa sin poder cambiar nada.

- Veo la misma lista que el administrador (HU-INT-01), sin el botón de agregar.
- El detalle de una integración que la empresa no tiene es `404 INTEGRATION_NOT_FOUND`, igual que un código inexistente
  (D110 punto 5).
- No veo el catálogo para agregar (`403`), ni el botón de conectar, ni los enlaces a las conexiones de cada servicio.

### HU-INT-08 · Saber qué integraciones vienen pronto, sin poder conectarlas aún

**Como** administrador, **quiero** ver en el catálogo las integraciones que todavía no están disponibles **para** saber qué
podré conectar y planear.

- Las integraciones `coming_soon` (hoy Azure, Microsoft 365, Google Workspace, GitHub y Jira; GCP está disponible desde D112) se muestran y no se
  pueden conectar (D110 punto 6).
- Su detalle lleva solo qué hará, qué aportará y dónde se usará, en tiempo futuro; requisitos, permisos, seguridad y
  recursos llegan vacíos y `coverage` es `null`.
- Si la integración tiene plataforma de conexión, la disponibilidad es la de la plataforma (D67).

### HU-INT-09 · Conectar la organización de GitHub de mi empresa

**Como** administrador, **quiero** conectar GitHub **para** que Monkey muestre cómo se revisan y aprueban los cambios en el
código y las vulnerabilidades de sus dependencias.

⚪ **Bloqueada por P45** (P44 la cerró D129). Qué checks cuentan y a qué pruebas y controles van (P44), y en qué categoría de activo
entra GitHub, qué es el activo y con qué canal se conecta (P45), los decide el comité. Lo que ya está fijado:

- Sin la cadena check → prueba → control ratificada, un resultado de GitHub **no cuenta** (D56).
- Si se conecta con una aplicación propia de Monkey, su llave nunca llega a la evaluación automática: por cada cliente y
  cada corrida se emite un token de instalación ([README](README.md#la-frontera-del-conector-objetivo-d110)).

### HU-INT-10 · Llevar el trabajo de cumplimiento a Jira

**Como** persona de la empresa que gestiona el trabajo de cumplimiento, **quiero** llevarlo a Jira **para** seguirlo en la
herramienta que ya usa mi equipo.

⚪ **Decidida (D138, D144), por construir en MD-508.** El comité decide si es solo remediación o también evidencia, quién la conecta y con qué
permisos, y desde qué pantallas y qué roles se crea un ticket. Lo que ya está fijado:

- Jira no mide nada: es una integración de flujo de trabajo (`workflow`, D110 punto 1).
- Hoy aparece en el catálogo como `coming_soon` y no se puede conectar (D110 punto 6).
