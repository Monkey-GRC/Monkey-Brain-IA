# Decisiones — Integraciones

Por qué Integraciones es como es. **Se consulta para reabrir, no para construir**: lo vigente está en [`arquitectura/integraciones/`](../../arquitectura/integraciones/README.md) y en [`contracts/integraciones.md`](../../../../../../contracts/integraciones.md). Índice de todas las decisiones: [`README.md`](README.md).

## D110 · Integraciones es un módulo propio, con su sección en el menú y una interfaz única de conector (2026-11-12)

*Decisión:*

1. **Integraciones es un módulo de producto** (`integrations` en el Backend) y una **sección del menú lateral** de Frontend-Platform, de toda la empresa. No todas las integraciones miden: cada una tiene un **propósito**, `measurement` (medición y cumplimiento) o `workflow` (gestión y flujo de trabajo).
2. **El catálogo de integraciones vive en la base** (`catalog.integrations`), como el de conexiones (D67). Una integración de medición puede apuntar a su plataforma de conexión (`capability_platforms`); entonces su nombre, logo y disponibilidad son **los de la plataforma** (un dato, un dueño).
3. **Lo que el cliente ya conectó se deriva**, no se guarda: la lista sale de sus conexiones (`assets` y `asset_provisionings`), con un estado `active` · `pending` · `needs_attention`. `needs_attention` es un problema de conexión, nunca un incumplimiento (D57).
4. **Las conexiones con la sonda (`ac_02` a `ac_06`) no son integraciones**: siguen en las conexiones de cada servicio. Las plataformas del catálogo del comité (D67) se conservan tal como están.
5. **Quién la ve:** `admin_empresa` ve la lista, el catálogo y el detalle de cualquier integración; el `auditor` ve la lista y el detalle de las que la empresa tiene conectadas, en lectura. Los demás roles, no.
6. **GitHub y Jira entran al catálogo como `coming_soon`.** Conectarlas espera a P44, P45 y P46.
7. **Arquitectura objetivo:** el módulo `integrations` define una interfaz única de conector (conectar, validar, obtener credencial temporal, ejecutar, normalizar resultado) y el **trabajador aislado** (`Backend/src/runner`, D57) es el trabajador de integraciones: un adaptador por proveedor detrás de esa interfaz. **No** se separa en un servicio aparte hasta que haya una razón medible (carga, aislamiento de credenciales exigido por un auditor).

*Por qué:* El cliente necesita ver en un solo lugar con qué plataformas trabaja Monkey, incluidas las que no miden. Derivar el estado evita una segunda fuente de verdad. La frontera del conector permite sumar proveedores sin tocar el resto del backend, y el trabajador ya está aislado: un servicio aparte hoy sumaría red, autenticación entre servicios y otro despliegue sin un cliente que lo pida.

*Qué cambia:* Tabla `catalog.integrations` y enum `integration_purpose`; `GET /v1/integrations/catalog` y `GET /v1/integrations`; sección «Integraciones» en el menú (MD-211). La interfaz de conector se construye con la primera integración nueva que se conecte de verdad.

La propuso desarrollo y la aprobó el responsable de producto; **no es una decisión del comité**. Lo que solo puede decidir el comité quedó en P44, P45 y P46.

**Fuente:** Rod, sesión de planificación de integraciones, 2026-11-12 (MD-211).

---

## D144 · Quién conecta Jira, desde dónde y quién crea un ticket (2026-11-23; cierra P46)

**Decisión** (puntos 2 y 3 de `P46`; el 1 lo respondió D138):

1. **Conecta Jira el `admin_empresa`**, con una cuenta de servicio de su empresa con permiso solo para **crear y leer tickets** del proyecto que elija.
2. **Un ticket se crea** desde el detalle del control y desde el mensaje de brecha (D138). Pueden crearlo el `admin_empresa`, el `responsable` en sus controles y el `delegado` en los que ejecuta. Cerrar el ticket no cierra el incumplimiento (D138).

**Por qué.** Era lo que faltaba para construir RC-17.

**Qué cambia.** `contracts/integraciones.md`, `arquitectura/integraciones/` (HU-INT-10 y CU-INT-06 dejan de estar bloqueados) y MD-508. Jira deja de ser `coming_soon` cuando se construya (ajusta el punto 6 de D110).

**Fuente:** Héctor Ríos (Rod), 2026-11-23, como decisión de desarrollo, para no bloquear la VF18. **No es una decisión del comité.**
