# Modelo de datos — §5 Usuarios

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Los 4 roles de empresa, los grupos, el dueño y el ejecutor de cada control, tablas, políticas de seguridad, cargos y matriz de permisos. **Léelo:** Antes de tocar usuarios, roles o permisos.
> Los números de sección (§) se conservan: cualquier cita a «§5» apunta aquí.

## 5. Módulo Usuarios

**Qué es:** quién puede entrar, con qué rol, y qué parte del trabajo le toca dentro de su empresa.

**Qué resuelve:** que el auditor no vea todos los tenants, que cada persona solo toque lo suyo, que quien valida sea el experto de la empresa, y que la revocación de un acceso sea demostrable ante un auditor.

Definido por el comité en su modelo de gestión de usuarios (hoja «Modelo de Gestión usuarios» del TSC integral, ver §0), ajustado por D96 y rediseñado por D102 (2026-11-03): la cadena de asignación es `admin_empresa` → `responsable` → `delegado`. **Ante una duda de roles y permisos manda esa hoja.**

### 5.1 Los roles (D96, D102, D136)

| Rol | Quién es | Alcance | MFA |
|---|---|---|---|
| `admin_monkey` | Equipo Monkey | Global: registra y archiva empresas y su primer administrador, administra **el catálogo maestro** y fija el **cupo de usuarios** de cada empresa (D103). No entra al cumplimiento de un cliente (MD-146 le dará una vista de solo lectura) | Sí |
| `admin_empresa` | CISO, Compliance Leader: **el experto en compliance de la empresa** y líder de la cadena | Su empresa. **Crea a todo el equipo y sus grupos, asigna el dueño de cada control, ve todo, revisa y valida cualquier evidencia, decide las exclusiones y edita controles, riesgos y causas** | Sí |
| `responsable` | **Dueño** de los controles que el administrador le asigna; lidera un equipo | Solo **sus controles** (los suyos y los que ejecutan sus delegados). Sube evidencia, asigna ejecutor a su equipo y **revisa** lo que suben sus delegados | Sí |
| `delegado` | Miembro del equipo de un `responsable`; **ejecuta** los controles que su responsable le asigna | Solo los controles en los que es ejecutor. Sube evidencia y registra resultados; no revisa | Sí |
| `auditor` | Quien audita el cumplimiento de la empresa dentro de Monkey (suele ser una persona externa, pero su cuenta **pertenece a la empresa**) | Lectura de **todo** el cumplimiento de **todos** los servicios de su empresa, incluida la cadena (dueño y ejecutor de cada control) + módulo de auditoría. **Registra observaciones.** No califica por ahora (`P35`) | Sí |
| `colaborador` | Empleados y contratistas que deben conocer los documentos de la empresa (D136) | Solo **los documentos que le asignan**: los lee y los acepta. No accede a controles, riesgos ni evidencia | Sí |

**El `funcional` desapareció (D102):** su lugar lo ocupan el `responsable` (dueño) y el `delegado` (ejecutor). El «responsable» del modelo
anterior, el cargo ante el auditor, se llama ahora **cargo de la organización** (§5.4).

**Quién crea a quién (D136).** `admin_monkey` registra la empresa y su clave de acceso, y con ella entra el primer `admin_empresa` (D43). Desde ahí **solo `admin_monkey` y `admin_empresa` crean, editan y desactivan usuarios y asignan roles** (Tabla 2 de la VF18): el `responsable` ya no crea a sus delegados, pero sigue **delegando** sus controles en un usuario de su equipo. `admin_monkey` restablece el segundo factor del `admin_empresa` (D94) y, con la VF18, también puede gestionar los usuarios de una empresa y ver su cumplimiento (§5.5).

**Cupo de usuarios (D103).** `companies.max_users` lo fija `admin_monkey`. Cuentan las cuentas `active`, `pending` y `suspended` de cualquier rol; una
`inactive` no. Al llegar al tope no se crea ni se reactiva a nadie (`USER_LIMIT_REACHED`).

### El `admin_empresa` es el experto en compliance (D96, D102)

1. **Crea y desactiva** a su equipo (desactivar es la baja, `CC6.3`) y organiza los **grupos**.
2. **Asigna el dueño de cada control**: a un `responsable` o a sí mismo. Es el único que lo hace y el único que lo reasigna. Un control sin dueño queda **«Sin asignar»**.
3. **Ve todo**, incluido cuántos controles tiene cada persona y su avance (sin tope).
4. **Da la aprobación final del cumplimiento de cada control**, después de la del responsable; si él es el responsable, la suya es la única (D132).
5. **Asigna el responsable de cada documento** y puede aprobar documentos (D133).
6. **Decide las excepciones** de un check, con 90 días como máximo (D135), y cambia la periodicidad de un control con justificación (G-10).
7. **Crea, edita y da de baja controles propios, riesgos y causas** directamente, con advertencia y confirmación (§7.1, `P33`). Dar de baja no borra.
8. Responde las observaciones del auditor.

Puede subir evidencia, pero **no es su foco**. Si es el responsable del control, su aprobación es la final (G-05, D132, que cerró `P34`).

### Grupos, dueño y ejecutor (D102)

- **Un grupo** (`user_groups`) tiene un nombre y un líder. El `admin_empresa` lidera uno o varios grupos de responsables (p. ej. «Responsables - Servicio IA»); cada `responsable` queda en el grupo «Responsables» y lidera **a lo sumo un** equipo de delegados, que **crea él cuando quiere** o el administrador por él (D104): no nace con su cuenta. **Cada persona pertenece a un solo grupo** (`users.group_id`). El tipo del grupo es `user_groups.kind` (`group_kind`: `responsables` o `team`) y un índice único parcial por `leader_id` donde `kind = 'team'` garantiza un solo equipo por responsable. Que un `team` lo lidere un `responsable` es una **invariante de aplicación** (un `CHECK` no cruza tablas): la mantiene la creación de grupos. Al migrar, si un responsable tenía varios equipos, el más antiguo conserva a todos los miembros y los demás quedan vacíos como grupos de responsables renombrados «… (fusionado n)»; nada se borra. Un delegado no existe sin equipo; sin equipo, la persona es un `responsable` que trabaja solo. Solo el `admin_empresa` mueve a un delegado de equipo.
- **La unidad de asignación es el control completo** (`client_controls`, que cuelga de un servicio). No hay dimensión ni especialidad: quien responde por un control responde por **todas** sus pruebas. Las personas son de la empresa, no de un servicio: el mismo control en el servicio A y en el B se asigna por separado, y un control nuevo llega sin dueño.
- **Dueño:** un `responsable` o el `admin_empresa`. **Ejecutor:** un `delegado` del equipo del dueño; si no hay, **ejecuta el dueño**. Un control tiene un dueño y a lo sumo un ejecutor.
- **Quién asigna:** el `admin_empresa` el dueño; el `responsable` el ejecutor, entre sus delegados. Un responsable no asigna a otro responsable; el administrador no asigna directo a un delegado. Al cambiar el dueño, el ejecutor se limpia.
- **La asignación es seguimiento, no un candado:** dueño, ejecutor y `admin_empresa` pueden subir evidencia y registrar resultados.
- **Baja:** al desactivar a alguien con controles se avisa y se pide confirmación. Un delegado desactivado deja sus controles con su dueño, sin ejecutor. Un responsable con delegados `active` o `pending` **no se puede desactivar**; sin delegados, sus controles quedan «Sin asignar». El historial se conserva.
- **`is_internal`:** al crear un delegado se marca si es de la compañía o externo; solo etiqueta, no cambia permisos.

**Cómo llega una prueba manual a «cumple».** El ejecutor (o el dueño, o el `admin_empresa`) sube la evidencia → queda **en revisión** → la revisa el `responsable` dueño (si no la subió él) y el `admin_empresa` puede revisar también. Si revisaron los dos, aprueban los dos; **cualquier rechazo gana** y quien subió rehace con una versión nueva. Si revisó solo uno y aprobó, está aprobada. Un control cumple cuando **todas** sus pruebas están en orden. Para una prueba técnica automática, el ejecutor corrige en la infraestructura y la siguiente corrida de la sonda lo confirma.

**Lo que ve cada uno (D102).** `responsable` y `delegado` ven **solo sus controles** y **el avance de lo suyo**, nunca el de la empresa ni la vista técnica. Su pantalla de entrada es «Mi trabajo». El `admin_empresa` ve todo y la carga de cada persona; el `auditor` ve todo y la cadena.

### El auditor es un rol aparte (D63, ajustado por D96)

`auditor` es un **rol aparte**, con sus propios permisos y su propia experiencia al entrar. Esto fija seis cosas:

1. **Lo crea solo `admin_empresa`**, desde la gestión de usuarios de su empresa, para una auditoría concreta. `admin_monkey` no crea auditores.
2. **Su cuenta pertenece a la empresa** (`users.company_id`). Por eso ve únicamente su empresa y no existe ninguna excepción de aislamiento para él. Cuando termina su trabajo, la empresa lo desactiva (`status = inactive`, `CC6.3`).
3. **Ve todo el cumplimiento de su empresa, en solo lectura**: todos los servicios, sus controles, tests, evidencias y el audit trail, con la **vista técnica** (códigos de requisito y de control, resultados por check).
4. **La vista técnica es del auditor y del `admin_empresa`** (D81; `P3` cerrada por D102: no hay Excel por pantalla y manda la matriz de §5.5). El `responsable` y el `delegado` ven solo la vista de negocio, de lo suyo.
5. **Escribe observaciones** (§7.6), que llegan al dueño y al ejecutor del control; descarga evidencias y exporta reportes. **No valida** la evidencia, no crea ni edita controles ni riesgos, y no ejecuta tests.
6. **MFA TOTP obligatoria** (§5.3).

Su **calificación** (certificar o no el marco, D77) queda en pausa (`P35`): volverá según lo que pida el Excel.

**Que `admin_monkey` no pueda crear controles no contradice que Monkey cure el catálogo** (decisión D9): la matriz de permisos describe el **escenario del cliente**, donde Monkey no le inventa controles a nadie. El catálogo maestro se administra en Monkey Admin (§3).

### 5.2 Las tablas

```mermaid
erDiagram
    users {
        uuid id PK
        uuid company_id FK
        string email "unico global, en minusculas"
        string name "nullable (D51): la cuenta se identifica por su correo"
        string last_name "nullable (D51)"
        string password_hash "bcrypt+salt"
        enum role "admin_monkey|admin_empresa|responsable|delegado|auditor|colaborador"
        enum status "active|inactive|suspended|pending"
        enum preferred_language "es|en, por defecto es: idioma de sus correos (D111)"
        boolean is_mfa_enabled
        datetime last_login_at "nullable"
        int failed_login_attempts "bloqueo: 5 intentos"
        datetime locked_until "nullable, 15 min"
        datetime password_changed_at "ultimo cambio, no vence (D101)"
        text mfa_secret_encrypted "nullable, AES-256"
        uuid group_id FK "nullable: responsable y delegado; un solo grupo"
        boolean is_internal "nullable: solo delegado (D102)"
        datetime created_at
    }
    user_groups {
        uuid id PK
        uuid company_id FK "lo pide el RLS"
        string name "p. ej. Responsables - Servicio IA; unico por empresa; Responsables esta reservado"
        group_kind kind "responsables o team (D104); un responsable lidera a lo sumo un team"
        uuid leader_id FK "admin_empresa o responsable"
        datetime created_at
    }
    client_control_assignments {
        uuid id PK
        uuid company_id FK "denormalizado: lo pide el RLS"
        uuid client_control_id FK "unico: un dueno por control del cliente"
        uuid owner_id FK "responsable o admin_empresa"
        uuid executor_id FK "nullable: delegado del equipo del dueno; nulo = ejecuta el dueno"
        uuid assigned_by FK
        datetime assigned_at
        datetime updated_at
    }
    user_activation_codes {
        uuid id PK
        uuid company_id FK "la de la cuenta a activar: lo pide el RLS"
        uuid user_id FK "la cuenta pending"
        uuid created_by FK "admin_empresa (o quien crea la cuenta)"
        string code_hash "HMAC del codigo, nunca el codigo"
        enum status "pending|used|expired|revoked"
        datetime expires_at "7 dias por defecto"
        datetime used_at "nullable"
        datetime created_at
    }
    sessions {
        uuid id PK
        uuid company_id FK "denormalizado: lo pide el RLS"
        uuid user_id FK
        string refresh_token_hash
        string ip_address
        string user_agent
        datetime expires_at "created_at + 8 h"
        datetime revoked_at "nullable"
        datetime created_at "inicio: tope de 8 h"
        datetime last_activity_at "inactividad: 30 min"
    }
    trusted_devices {
        uuid id PK
        uuid company_id FK "denormalizado: lo pide el RLS"
        uuid user_id FK
        string token_hash "HMAC con pepper, unico"
        string browser "nullable"
        string os "nullable"
        string device_type "computer, mobile o tablet; nullable"
        string ip_address "ultimo ingreso"
        string country "ISO alfa-2, nullable"
        json city "es y en, nullable"
        datetime expires_at "created_at + 30 dias, no se renueva"
        datetime last_used_at "nullable"
        datetime revoked_at "nullable"
        datetime created_at
    }
    api_keys {
        uuid id PK
        uuid company_id FK
        uuid created_by FK
        string name
        string key_hash
        enum status "active|revoked"
        datetime last_rotated_at "max 90 dias"
    }
    audit_logs {
        uuid id PK
        uuid tenant_id FK "nullable, acciones de plataforma"
        uuid user_id FK "nullable, login con email inexistente"
        string attempted_email "nullable"
        string action
        string resource
        json before_state "nullable"
        json after_state "nullable"
        string ip_address
        string user_agent
        enum result "success|error"
        datetime created_at
    }
    organization_responsibles {
        uuid id PK
        uuid organization_id FK
        enum type "coo|it|compliance|process|ciso|asset_owner"
        string person_name
    }
    companies ||--o{ users : "emplea"
    companies ||--o{ user_groups : "organiza"
    user_groups ||--o{ users : "agrupa"
    users ||--o{ user_groups : "lidera"
    client_controls ||--o| client_control_assignments : "se asigna en"
    users ||--o{ client_control_assignments : "es dueno o ejecutor"
    users ||--o{ user_activation_codes : "se activa con"
    users ||--o{ sessions : "abre"
    users ||--o{ trusted_devices : "recuerda"
    users ||--o{ audit_logs : "registra"
    companies ||--o{ api_keys : "integra con"
```

**`sessions`:** access token de 15 min; refresh token rotado en cada uso; la sesión se cierra a los **30 min sin actividad** (`last_activity_at`) y a las **8 h de creada** (`created_at`, `expires_at`), como pide §5.3. Las dos columnas de actividad se añadieron el 2026-09-30 (migración `platform_sessions_activity_tracking`): sin ellas el servidor no podía aplicar esa política.

**`trusted_devices` (D123, SEG-84, MD-217):** un navegador donde la persona marcó «Recordar este dispositivo»; ahí el login pide la contraseña pero no el código. El token vive solo en la cookie `mnk_device` (Monkey Admin, `X-Monkey-Client: admin`, no la lee ni la escribe ni la borra, MD-489); aquí, su HMAC. Vence a los 30 días sin renovarse y se revoca (`revoked_at`) al cerrar sesión, al cambiar o recuperar la contraseña, al restablecer la MFA, al regenerar los códigos de recuperación, al dar de baja a la persona o archivar su empresa, o cuando la persona lo olvida. `browser`, `os` y `device_type` se toman al recordarlo (la UI agrupa por tipo y sistema); `ip_address`, `country` y `city` son del último ingreso; la ubicación sale de una base GeoIP local (la IP no va a terceros).

**`pending` y los códigos de activación (D95, D96).** Una cuenta que crea alguien más (las de `responsable`, `delegado` y `auditor`, que crea el `admin_empresa`, o la de `delegado`, que también crea su `responsable`) existe desde el alta en estado `pending`, con una contraseña imposible de adivinar (el hash de un secreto aleatorio que se descarta, con el mismo costo que uno real: desde fuera no se distingue de una contraseña mala), y **no puede iniciar sesión**. La persona la activa con un **código de un solo uso**, ligado al correo de la cuenta (`user_activation_codes`): pone su contraseña y la cuenta pasa a `active`, todo en una transacción. El código se guarda solo como HMAC, vence (7 días), se puede reemitir mientras la cuenta siga `pending` (el anterior queda `revoked`) y comparte el freno de intentos de las claves de acceso. Es el mismo mecanismo de la clave de acceso de una empresa (D43, D51), pero de una persona y no de una empresa.

**El estado del usuario no es cosmético:** `CC6.3` (deprovisioning) se cumple pasando el usuario a `inactive` y cerrando su sesión. Es un control auditable, no una preferencia de UI.

**`client_control_assignments` apunta a `client_controls`, no a `controls`.** Un usuario es dueño o ejecutor del control *de su empresa* (que cuelga de un servicio), no del control del catálogo maestro. Hay **una fila por control del cliente**; sin fila el control está «Sin asignar». La tabla no guarda dimensión: se eliminaron `user_dimensions`, `service_dimension_owners` y la columna `dimension` (D102).

**Cupo.** `companies.max_users` (§4.1) limita las cuentas de la empresa que no están `inactive`.

> **Corregido el 2026-09-26 al auditar los contratos:** `users` no tenía ningún campo de nombre de persona, pero el modelo de usuarios del comité lo exige (*"Email, nombre, rol, empresa, controles asignados"*). Gana el documento del comité: se añaden `name` y `last_name`.
>
> **Después, D51 (2026-10-06) los volvió opcionales:** la cuenta se identifica por el correo y el nombre se completará en el perfil. La activación ya no los pide.

### 5.3 Políticas de seguridad de la plataforma

**Requisitos, no sugerencias.** Cada uno responde a una norma concreta, que es lo que lo hace no negociable:

| Política | Valor | Por qué ese valor |
|---|---|---|
| Sesión | 30 min de inactividad, 8 h máximo | Reduce la ventana de una sesión robada |
| Contraseña — longitud | **15+ caracteres** (D137) | Tabla 3 de la VF18: lo que pasan los checks de las plataformas |
| Contraseña — complejidad | mayúscula + minúscula + número + símbolo | Encarece la fuerza bruta |
| Contraseña — historial | No reutilizar **las últimas 24** (D137) | Tabla 3 de la VF18 |
| Contraseña — expiración | **60 días o menos** (D137, revierte D101 punto 1), con aviso previo. Cambio voluntario con contraseña actual + segundo factor; recuperación por correo + segundo factor | Tabla 4 de la VF18: Monkey aplica a sus cuentas lo que recomienda al implementador |
| MFA | TOTP obligatoria para **todos los roles** (D66, D96, D102: se mantiene hasta que existan otras formas de ingreso). La persona puede **recordar un dispositivo 30 días**: ahí solo pide la contraseña; `admin_monkey` no (D123) | Protege el acceso crítico |
| Cifrado en reposo | AES-256 (bcrypt+salt para contraseñas, secreto MFA cifrado) | Requisito NIST |
| Cifrado en tránsito | TLS 1.3 + HSTS | Requisito PCI DSS |
| Rotación de API keys | 90 días | Acota el daño de una key comprometida |
| Rate limiting | 100/min por usuario, 1000/min por empresa, más un tope por dirección en las rutas públicas; contadores compartidos en Redis (D124) | Previene abuso y DoS |
| Retención del audit trail | 7 años, inmutable, append-only (salvo una empresa dada de baja, D97) | SOC 2 Type II |
| IP whitelist | opcional, configurable | Control adicional de acceso |
| Bloqueo de cuenta | 5 intentos fallidos, 15 min | Previene fuerza bruta |

> **MFA es un requisito de seguridad sin excepciones.** Es TOTP con 10 códigos de recuperación y se exige en el ingreso de todos los roles (D94, D102); `MFA_REQUIRED=false` solo se admite fuera de producción. Un dispositivo recordado (D123, SEG-84) no la quita: es un segundo factor ya verificado en ese navegador, vence a los 30 días y se revoca al cambiar la contraseña o la MFA.

La autorización se verifica **en cada request** (*"no confiar en el frontend"*), sin caché: la sesión y el usuario se leen de la base en cada petición (D124).

### 5.4 Responsables organizacionales

**Se llama «cargo de la organización» (D102) para no confundirlo con el rol `responsable`.** Distinto del rol de aplicación: el cargo responde ante el auditor, el rol dice qué puede tocar en el sistema. Y **distinto del responsable por dimensión** (§5.1): ese es una persona con cuenta que ejecuta pruebas; el cargo es quien responde ante el auditor. Los cargos (`organization_responsibles.type`): **`coo`** (autoriza accesos), **`it`** (ejecuta lo técnico), **`compliance`**, **`process`**, **`ciso`**, **`asset_owner`**.

**El cargo y la persona viven ambos en el escenario del cliente**, en `organization_responsibles` (`type` es el cargo, `person_name` quien lo ocupa hoy), y la persona puede cambiar sin tocar quien apunta al cargo (decisión A1, precisada por D30: no existe un catálogo global de cargos). Hay responsable **por nivel de objeto** — activo, control, cumplimiento y riesgo (§9).

---

### 5.5 Matriz de permisos

**Es la Tabla 2 de la hoja «Modelo de Gestión usuarios» de la VF18** (D136, RC-14): ✓ permitido · ⊗ permitido con
restricción · vacío, prohibido. Las filas marcadas *(D…)* no están en la tabla del comité y se conservan de lo
decidido antes, porque el libro no las define (DEV-16).

| Módulo | Acción | `admin_monkey` | `admin_empresa` | `responsable` | `delegado` | `auditor` | `colaborador` |
|---|---|---|---|---|---|---|---|
| Empresas | Crear, suspender o eliminar empresa (y fijar su cupo, D103) | ✓ | | | | | |
| Empresas | Ver y editar la configuración de la empresa | ✓ | ✓ | | | | |
| Usuarios | Crear, editar, desactivar y reactivar usuarios; asignar roles | ✓ | ✓ | | | | |
| Usuarios | Asignar controles a usuarios (el dueño de un control) | ✓ | ✓ | | | | |
| Usuarios | Crear grupos y mover a alguien de equipo *(D102)* | | ✓ | | | | |
| Usuarios | Ver la carga de trabajo de cada persona *(D122)* | | ✓ | | | | |
| Controles | Crear y dar de baja un control | | ✓ | | | | |
| Controles | Editar un control | | ✓ | ⊗ | | | |
| Controles | Ver un control | ✓ | ✓ | ⊗ | ⊗ | ✓ | |
| Controles | Delegar un control en un usuario de su equipo | | ✓ | ⊗ | | | |
| Controles | Primera aprobación del cumplimiento del control | | ✓ | ⊗ | | | |
| Controles | Aprobación final del cumplimiento del control | | ✓ | | | | |
| Riesgos | Crear riesgo | | ✓ | | | | |
| Riesgos | Editar riesgo | | ✓ | ⊗ | | | |
| Riesgos | Ver riesgo | ✓ | ✓ | ⊗ | ⊗ | ✓ | |
| Evidencia | Subir evidencia | | ✓ | ⊗ | ⊗ | | |
| Evidencia | Ver evidencia | ✓ | ✓ | ⊗ | ⊗ | ✓ | |
| Evidencia | Dar de baja una evidencia («eliminar»: nunca se borra) | | ✓ | | | | |
| Evidencia | Decidir la excepción de un check *(D135)* | | ✓ | | | | |
| Documentos | Asignar el responsable de un documento | ✓ | ✓ | | | | |
| Documentos | Crear, importar o editar un documento y sus versiones | | ✓ | ⊗ | | | |
| Documentos | Definir el flujo de aprobación; enviar o cancelar la solicitud | | ✓ | ⊗ | | | |
| Documentos | Aprobar o rechazar un documento | | ✓ | ⊗ | | | |
| Documentos | Definir quiénes deben aceptarlo | | ✓ | ⊗ | | | |
| Documentos | Aceptar un documento asignado | | ✓ | ✓ | ✓ | | ✓ |
| Documentos | Ver el documento vigente | ✓ | ✓ | ⊗ | ⊗ | ✓ | ⊗ |
| Documentos | Ver el historial de versiones, aprobaciones y aceptaciones | ✓ | ✓ | ⊗ | | ✓ | |
| Documentos | Archivar un documento | | ✓ | | | | |
| Pruebas | Ejecutar o relanzar una prueba | | ✓ | ⊗ | ⊗ | ⊗ | |
| Pruebas | Ver resultados de pruebas | ✓ | ✓ | ⊗ | ⊗ | ✓ | |
| Auditoría | Módulo de auditoría y registrar observaciones (§7.6) | | | | | ✓ | |
| Auditoría | Responder una observación *(D102)* | | ✓ | ✓ de su control | ✓ de lo que ejecuta | | |
| Auditoría | Ver el registro de auditoría | ✓ | ✓ | ⊗ | | ✓ | |
| Reportes | Exportar reportes de cumplimiento y el borrador SOC | ✓ | ✓ | | | ✓ | |
| Reportes | Generar el tablero de cumplimiento | ✓ | ✓ | ⊗ | | ✓ | |
| Reportes | Vista técnica (códigos, requisitos, pruebas y resultados por check) *(D81)* | | ✓ | | | ✓ | |
| Integraciones | Crear o rotar API keys y configurar conectores | ✓ | ✓ | | | | |
| Integraciones | Ver las integraciones de la empresa *(D110)* | | ✓ | | | ✓ solo lectura | |
| Seguridad | Configurar políticas de seguridad | ✓ | ✓ | | | | |
| Seguridad | Gestionar la MFA de un usuario | ✓ | ✓ | ⊗ su equipo | | | |
| Cuenta | Editar su perfil y configurar su propia MFA | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

**Las restricciones ⊗** (notas de la Tabla 2):

- **Controles:** el `responsable` edita, aprueba y delega **solo los controles de los que es responsable**, y sube
  evidencia en los suyos o en los que le delegaron. El `delegado` ve y carga evidencia **solo en los controles que su
  responsable le delegó**; no aprueba ni delega.
- **Documentos:** el `responsable` crea, edita, define el flujo, envía y define la aceptación **solo de los documentos
  de los que es responsable**; aprueba **solo si el responsable del documento lo eligió como aprobador** (D-02,
  D-03); ve los documentos de sus controles y los que le asignaron. El `colaborador` ve solo los que le asignaron.
- **Lo demás** (riesgos, pruebas, registro de auditoría, tablero, MFA) se acota a los controles del `responsable` y a
  lo delegado al `delegado`; el `auditor` ejecuta pruebas solo de lectura sobre lo que audita.

Tres cosas que se leen mal si no se dicen:

- **`admin_monkey` puede gestionar los usuarios de una empresa y ver su cumplimiento** (D136). Antes no entraba al
  escenario de un cliente; el aislamiento por RLS tiene que admitir esa lectura sin abrir la escritura.
- **Nadie borra una evidencia ni un control**: «eliminar» es dar de baja y el historial se conserva (D96, D119).
- **No hay roles personalizados**: los seis roles son fijos.

**Cómo se aplica (MD-503, D150).** La matriz vive en un solo lugar del Backend y un guard central **niega por defecto**
toda ruta sin permiso declarado (SEG-86). Lo que aún no se construye queda declarado como pendiente:

- **`admin_monkey` sobre los datos de una empresa** (ver, gestionar usuarios y asignaciones, conectores): pendiente de
  MD-146; hoy recibe `403` (DT-124).
- **Ejecutar pruebas** para `responsable`, `delegado` y `auditor` (⊗): pendiente (DT-123); hoy solo `admin_empresa`.
- **Aprobar el control (MD-504, 2026-11-25):** construido con `controls.approve_first` (`responsable` dueño y `admin_empresa`) y `controls.approve_final` (`admin_empresa`); registrar el resultado de una prueba manual es `verdicts.register` [N, A, S, N, N, N] (el `responsable`; el `admin_empresa` si no hay responsable o lo es él). `evidence.review` y `verdicts.review` se retiraron. **Documentos completos:** MD-506. El corte mínimo de Documentos (D152) deja «Mis
  documentos» y aceptar para los asignados, y listar, publicar y asignar para el `admin_empresa`.
- **R5, plan de remediación, «No aplica» y ocurrencias (MD-529, 2026-11-26):** construido con `controls.propose_level`, `controls.plan_register`, `controls.na_request` y `controls.declare_no_occurrences` [N, A, S, N, N, N] (los lleva el `responsable` dueño; el `admin_empresa` solo si el control no tiene responsable o él lo es, y entonces lo que propone vale directo, G-05) y `controls.decide_level`, `controls.plan_decide` y `controls.na_decide` [N, A, N, N, N, N] (decide el `admin_empresa`). El directorio de personas para elegir quién hace un plan es `users.directory` [N, A, A, N, N, N]; `work.mine` pasa a [N, A, S, S, N, N] (el `admin_empresa` solo ve su bandeja «Por aprobar»). Registrar una ocurrencia usa `evidence.upload`. Contrato: `contracts/cumplimiento/aprobacion.md`.
- **«Crear grupos» solo `admin_empresa`** (la matriz manda sobre D104); el `delegado` no ve el tablero de cumplimiento.

### 5.6 Cómo el modelo de usuarios sostiene SOC 2

El propio modelo de acceso es evidencia para el marco. Mapeo del comité:

| TSC | Qué exige | Con qué se cumple |
|---|---|---|
| CC6.1 | Aprovisionamiento de accesos | `users` + `user_groups` + `client_control_assignments` + el cupo `companies.max_users` |
| CC6.2 | Derechos de acceso | La matriz de §5.5 |
| CC6.3 | Desaprovisionamiento | `users.status` a `inactive` + cierre de sesión |
| CC7.1 | Monitoreo del sistema | `audit_logs` inmutable |
| CC7.2 | Detección de actividad no autorizada | Registro de intentos de acceso denegados |
| CC7.3 | Detección de excepciones | Alerta ante 403 y cambios anómalos |
| CC9.1 | Autenticación | MFA TOTP + política de contraseña (§5.3) |
| CC9.2 | Gestión de cambios | `audit_logs` con estado antes y después |
| C1.2 | Confidencialidad | Aislamiento por tenant (§4.3) + AES-256 |

Es la razón por la que las políticas de §5.3 son requisitos y no preferencias: cada una responde a un criterio que el auditor va a pedir.

---
