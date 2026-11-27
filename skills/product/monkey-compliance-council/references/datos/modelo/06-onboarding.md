# Modelo de datos — §6 Onboarding

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Los 3 componentes que capturan el contexto del cliente. **Léelo:** Antes de tocar el onboarding.
> Los números de sección (§) se conservan: cualquier cita a «§6» apunta aquí.

## 6. Módulo Onboarding

**Qué es:** los 3 componentes que capturan el contexto del cliente antes de que exista ningún
cálculo de cumplimiento. Detalle campo por campo en 6.1 a 6.3 de este archivo; el recorrido de cada componente, en `arquitectura/onboarding/README.md`.

**Qué resuelve:** sin organización y servicio declarados no hay nada que medir. Es el
único flujo del producto que es secuencial y obligatorio.

**Cumplimiento no es un 4º componente** (decisión D23, confirmada por el comité el
2026-09-26): al elegir marco en el Componente 2 el
catálogo se clona solo, y personalizarlo es un módulo aparte que no bloquea nada (§7).

### 6.1 Componente 1 — Contexto Organizacional

Se llena **una vez por empresa**. Diez campos: identidad, perfil y jurisdicción.

```mermaid
erDiagram
    organizations {
        uuid id PK
        uuid company_id FK
        string name "precargado y bloqueado, viene de companies"
        text description
        enum size "from_10_to_50 ... more_than_5000"
        enum industry
        enum business_model "19 opciones mas other (D73)"
        enum years_in_operation "nullable"
        json incorporation_countries
        json client_countries
        enum compliance_maturity
        datetime created_at
        datetime updated_at
    }
    regulations {
        uuid id PK
        string code
        string name
        string jurisdiction
    }
    organization_regulations {
        uuid id PK
        uuid organization_id FK
        uuid regulation_id FK
    }
    companies ||--|| organizations : "declara su negocio como"
    organizations ||--o{ organization_regulations : "sujeta a"
    regulations ||--o{ organization_regulations : "aplica a"
    organizations ||--o{ organization_responsibles : "designa"
```

**`companies` y `organizations` son dos cosas distintas y conviene no fusionarlas.**
`companies` es el tenant: existe desde Monkey Admin, antes de que el cliente entre, y lleva
el aislamiento de datos. `organizations` es el contenido de negocio que el cliente declara
dentro de ese tenant. El `name` se fija en `companies` y se refleja bloqueado aquí.

**Los rangos numéricos se nombran con prefijo.** `size` y `active_client_count` son rangos
(«10-50», «1-10»…), y un valor de enum no puede empezar por dígito: se escriben
`from_10_to_50`, `from_51_to_200`, … `more_than_5000`. Las etiquetas que ve el usuario salen
de i18n, no del enum — la tabla de correspondencia está en `contracts/enums.md`.

> **Corregido el 2026-09-26:** `organizations` y `services` no llevaban `created_at`/`updated_at`
> mientras `companies` sí, sin razón. Se añaden por consistencia con la convención de fechas
> (`_at`). No es una decisión de producto, es la misma columna de auditoría del resto.

**`regulations` es tabla propia y no se puntúa** (decisión D10): nadie "contrata" la Ley
1581, pero sí determina qué le aplica. No entra al cálculo de cumplimiento.

> **Actualizado por D47:** el **cliente** sigue sin elegir un marco a nivel de empresa (no hay tal pregunta en
> este Componente 1), pero **Monkey Admin sí contrata el marco para la empresa al registrarla**
> (`platform.company_frameworks`, hoy solo SOC 2) y, al declarar un servicio, el cliente solo puede elegir
> entre los marcos que su empresa tiene contratados. Lo que dice el párrafo siguiente es la versión anterior.
>
> **Se vetó a propósito el campo "framework que desea gestionar" a nivel de empresa.** Los
> marcos se contratan **por servicio** — cada servicio puede perseguir uno distinto y no
> existe un framework "de la empresa". Esa pregunta vive en el Componente 2.

### 6.2 Componente 2 — Contexto del Servicio

Se llena **una vez por servicio** (un cliente puede declarar varios). Dieciséis campos,
incluida la carga de la Descripción del Sistema.

```mermaid
erDiagram
    services {
        uuid id PK
        uuid organization_id FK
        string name
        text description
        text scope_statement
        enum type "saas|bpo|call_center|data_center|ai"
        json industries_served
        enum active_client_count "nullable"
        json countries
        json data_types "pii|payment|phi"
        enum expected_availability
        enum deployment_scenario "nullable; sin uso desde D92, lo retira DT-81"
        enum previous_certification "nullable"
        datetime created_at
        datetime updated_at
    }
    service_trust_criteria {
        uuid id PK
        uuid service_id FK
        uuid trust_criterion_id FK
    }
    service_frameworks {
        uuid id PK
        uuid framework_id FK
        uuid service_id FK
        uuid catalog_version_id FK
        date contracted_at
        enum status
        string evaluation_period "AAAA-Tn: el periodo por defecto (trimestre natural)"
    }
    service_framework_periods {
        uuid id PK
        uuid tenant_id FK
        uuid service_framework_id FK
        date period_start "periodo auditado (D68, REQ-004)"
        date period_end "periodo auditado; en SOC 2 al menos PR-16"
        date cutoff_date "nullable: hoy hasta que se congela (D87)"
        enum status "open|closed (como mucho un open)"
        enum opened_by "user|system (D145)"
        timestamptz closed_at "nullable"
        timestamptz created_at
    }
    subservice_organizations {
        uuid id PK
        uuid service_id FK
        string provider "nullable"
        string service_provided "nullable"
        text responsibility "nullable"
        enum type "aws|azure|gcp|on_premise|hybrid"
    }
    csocs {
        uuid id PK
        uuid subservice_organization_id FK
        text expected_control
    }
    cuecs {
        uuid id PK
        uuid service_id FK
        text expected_control
    }
    system_descriptions {
        uuid id PK
        uuid service_id FK
        string link_url "nullable; al menos uno de los dos (D51)"
        string file_key "nullable; llave del objeto en S3/minio"
        json sections "10 secciones AICPA"
    }
    organizations ||--o{ services : "presta"
    services ||--o{ service_trust_criteria : "contrata"
    trust_criteria ||--o{ service_trust_criteria : "contratado por"
    services ||--o{ service_frameworks : "contrata marco"
    frameworks ||--o{ service_frameworks : "contratado en"
    service_frameworks ||--o{ service_framework_periods : "periodos auditados"
    services ||--o{ subservice_organizations : "depende de"
    subservice_organizations ||--o{ csocs : "debe aportar"
    services ||--o{ cuecs : "espera del cliente usuario"
    services ||--|| system_descriptions : "documentado en"
    services ||--o{ client_risks : "expuesto a (§7.2)"
```

**El servicio es la unidad de evaluación.** Todo el cumplimiento se mide por par
(servicio × marco). No existe un porcentaje de la empresa (§9).

**`trust_criteria` son dos cosas y hay que separarlas.** El criterio en sí (los 5 TSC) es
**catálogo** — clasifica a los requisitos (§3.1). Qué criterios contrató un servicio concreto
es **escenario del cliente**, y va en el puente `service_trust_criteria`. Modelarlo como una
sola tabla colgada del servicio rompía la FK de `requirements`, que necesita apuntar al
criterio del catálogo, no a la contratación de un cliente.

El filtro funciona así: si el servicio no contrata `privacy`, los requisitos clasificados
como `P*` no entran a su cálculo. **`security` es obligatorio siempre.**

**`service_frameworks` es el disparador del clonado.** Al crearse esta fila, el catálogo de
ese marco (riesgos, causas, controles) se clona al escenario del cliente (§3.5). Guarda
también **contra qué versión del catálogo** (`catalog_version_id`) y **desde qué periodo**
(`evaluation_period`) aplica, que es lo que evita que un control nuevo mueva el número a
mitad de periodo.

**La evaluación del comité es este par servicio × marco en un período** (D68, REQ-004): `service_frameworks` más su versión del catálogo (`catalog_version_id`), el **período auditado** (`period_start`, `period_end`, en `service_framework_periods`) y la **fecha de corte**. Sin esos cinco datos no se ejecuta ni se reutiliza un resultado (§9). `evaluation_period` queda como el período por defecto.

**Los períodos viven en `service_framework_periods` (MD-500, D145, D148)**, uno por fila, con RLS por `tenant_id`: como mucho uno `open` por `service_framework_id` (índice único parcial) y los `closed` como histórico, que no se editan. Una tarea diaria cierra el abierto cuyo `period_end` ya pasó y abre el siguiente con la misma duración (`opened_by = system`). La migración copia a esta tabla el período de cada `service_frameworks` que lo tenía, como `open` y `opened_by = user`, y después borra `period_start`, `period_end` y `cutoff_date` de `service_frameworks` (Rod, 2026-11-23).

**La regulación se declara solo a nivel de empresa** (D51, que revierte D45). `organization_regulations` dice a qué
normas de protección de datos está sujeta la empresa; **no hay `service_regulations`**: esas leyes aplican a la empresa,
no al servicio. No se puntúa (D10).

**La Descripción del Sistema se entrega con un enlace, un archivo o los dos** (D51): `system_descriptions.link_url` y
`file_key` (ambos opcionales, `CHECK` de que haya al menos uno). El archivo vive en S3 / minio; el modelo solo guarda la
llave. **Los marcos y sus categorías (D50):** `frameworks.availability` (`available` | `coming_soon`) distingue lo construido
de la oferta comercial. Hoy las categorías de los requisitos son las 5 de SOC 2 (`trust_criteria`); cuando se siembre otro
marco, cada marco usará las suyas (ISO 27001: 4 temas, PCI DSS: 12 requisitos, NIST CSF: 6 funciones): `trust_criteria` se
generaliza a dominios por marco (DT-38).

**`deployment_scenario` y el detalle del subservicio son opcionales al declarar el servicio** (D45):
el escenario de despliegue **ya no se captura en ningún lado** (D92: el cliente elige la plataforma al conectar) y la columna queda nula hasta que `DT-81` la retire; y de un proveedor solo el `type` es obligatorio (el "detalle" del Excel lo es).

**`csocs` y `cuecs` son tablas propias marcadas como no medibles por Monkey** (decisión D11).
Salen de las secciones 7 y 8 de la Descripción del Sistema. Existen porque el auditor los
pide, no porque Monkey los evalúe.

### 6.3 Componente 3 — Control Técnico

El cliente conecta su infraestructura real. **Nunca ve el nombre del proveedor del motor de
monitoreo**: se le habla de "sonda" o "capacidad automática".

```mermaid
erDiagram
    assets {
        uuid id PK
        uuid organization_id FK
        uuid responsible_id FK
        string code
        enum connection_category "ac_01 ... ac_06"
        enum type
        string name
        string platform "etiqueta descriptiva: en un activo descubierto, su sistema operativo o motor (D61)"
        uuid platform_id FK "la plataforma que el cliente eligió; obligatoria en una conexión, nula en un activo descubierto (D67)"
        string ip_address
        string location
        enum criticality
        json tags
        enum origin
        enum status
        enum operational_status "operational|warning|error|not_monitored"
        string technical_coverage "18/18"
        uuid parent_asset_id FK "la conexión de nube que lo descubrió (D61)"
        uuid resource_id FK "su recurso técnico, 1:1 (D61)"
    }
    service_assets {
        uuid id PK
        uuid asset_id FK
        uuid service_id FK
    }
    automated_capabilities {
        uuid id PK
        string catalog_code "ac_01 ... ac_06"
        string category
        enum asset_type "tipo del activo que produce esta conexión (D67)"
        string method
        json required_permissions
        string provider "interno, confidencial"
        string base_frequency
        text generated_evidence
    }
    asset_provisionings {
        uuid id PK
        uuid asset_id FK
        uuid automated_capability_id FK
        enum connection_status
        datetime last_validated_at
        string technical_coverage
        enum connection_method "readonly_role|access_keys|agent|identity_federation|app_certificate, nulo hasta elegir"
        string regions "las que el cliente declara; solo esas se evaluan"
        string external_id "lo genera Monkey, no es secreto"
        string role_arn "lo entrega el cliente, no es secreto"
        string project_number "GCP (D112): lo imprime el script de alta, no es secreto"
        string app_client_id "Microsoft 365 (D154): el ID de la aplicación del cliente, no es secreto"
        text certificate_pem "Microsoft 365 (D154): solo la parte PÚBLICA del certificado"
        string certificate_thumbprint "Microsoft 365: huella SHA-1 del certificado, no es secreto"
        datetime certificate_expires_at "Microsoft 365: vencimiento del certificado (DT-130)"
        datetime inventory_at "último descubrimiento de activos (D59)"
        text encrypted_credentials "cifrado AES-256-GCM, nunca se devuelve; en Microsoft 365, la clave privada del certificado"
        boolean is_active
        enum schedule_frequency "nullable: continuous|every_6h|every_24h"
    }
    capability_platforms {
        uuid id PK
        uuid automated_capability_id FK
        string code "unico por capacidad: aws, linux, postgresql..."
        string name "nombre de la marca, no se traduce"
        string logo_key "SVG oficial guardado en Frontend-Platform (D67)"
        enum availability "available|coming_soon (el de los marcos, D50)"
        int sort_order
    }
    integrations {
        uuid id PK
        string code "unico: aws, github, jira (D110)"
        enum purpose "measurement|workflow"
        uuid capability_platform_id FK "nulo si aun no tiene flujo de conexion; unico"
        string name "solo sin plataforma; con plataforma, el de ella"
        string logo_key "solo sin plataforma"
        enum availability "solo sin plataforma: available|coming_soon"
        int sort_order
    }
    platform_connection_methods {
        uuid id PK
        uuid platform_id FK
        enum connection_method "readonly_role|access_keys|agent|identity_federation|app_certificate"
        boolean is_recommended
        int sort_order
    }
    platform_regions {
        uuid id PK
        uuid platform_id FK
        string code "las que el cliente puede declarar; solo esas se evaluan"
        string name
        int sort_order
    }
    capability_frequencies {
        uuid id PK
        uuid automated_capability_id FK "unico con schedule_frequency"
        enum schedule_frequency "continuous|every_6h|every_24h"
    }
    deployment_scenario_capabilities {
        uuid id PK
        enum deployment_scenario "sin uso desde D92 (DT-81): cloud_managed_only|cloud_with_servers|on_premise|hybrid; unico con la capacidad"
        uuid automated_capability_id FK
    }
    services ||--o{ service_assets : "usa"
    assets ||--o{ service_assets : "da soporte a"
    organizations ||--o{ assets : "inventaria"
    assets ||--o{ asset_provisionings : "se prepara con"
    automated_capabilities ||--o{ asset_provisionings : "habilita"
    automated_capabilities ||--o{ capability_platforms : "se ofrece sobre"
    automated_capabilities ||--o{ capability_frequencies : "corre con"
    automated_capabilities ||--o{ deployment_scenario_capabilities : "se ofrece en"
    capability_platforms ||--o{ platform_connection_methods : "se conecta por"
    capability_platforms ||--o{ platform_regions : "declara"
    capability_platforms ||--o{ assets : "se conecta como"
    capability_platforms |o--o| integrations : "se presenta como"
```

**`assets` es lo que Monkey encuentra al conectar.** El cliente no declara cuántos activos tiene: los registra conectando
y ve lo que la conexión reconoció (D59). Se retiró el scope declarado (`scopes`, D60). **Cada recurso descubierto es un `asset` propio**, hijo de su
conexión de nube (`parent_asset_id`) y respaldado por su recurso técnico (`resource_id`); el servicio elige cuáles son suyos con `service_assets` (D61).

**El activo cuelga de la organización, no del servicio** (decisión A2). Un servidor puede dar
soporte a varios servicios y **no se duplica**: por eso existe el puente `service_assets`. Se
evalúa una vez y el resultado se lee desde cada servicio.

**Un aprovisionamiento nace inactivo** (`is_active = false`) y solo se activa al validar la
conexión: el flujo es conectar → validar → activar → programar. `encrypted_credentials` es
opcional porque las conexiones agentless no guardan credenciales.

**`operational_status` es un enum, no un booleano:** 🟢 `operational` · 🟡 `warning` ·
🔴 `error` · ⚪ **`not_monitored`**. Regla del comité: **"Automatizado ≠ Operativo"**.

**Se ofrecen las seis conexiones, sin filtrar (D92).** Antes el `deployment_scenario` del servicio decidía cuáles (`deployment_scenario_capabilities`); ya no se pregunta ni se usa:

| Código | Categoría | Plataformas que el cliente elige | Método | Frecuencia |
|---|---|---|---|---|
| `ac_01` | Servicios cloud gestionados | AWS, Azure, GCP, Microsoft 365, Google Workspace | API / OAuth read-only | **6-24 h** |
| `ac_02` | Servidores en nube / VPS | Linux, Windows, HP-UX, AIX, Solaris | Agente ligero o agentless | **Continuo** |
| `ac_03` | BD en nube | PostgreSQL, MySQL, SQL Server, Oracle, MongoDB | Agente + usuario read-only | Continuo |
| `ac_04` | Servidores on-premise | Linux, Windows, HP-UX, AIX, Solaris | Agente ligero | Continuo |
| `ac_05` | BD on-premise | PostgreSQL, MySQL/MariaDB, SQL Server, Oracle, MongoDB | Agente + usuario read-only | Continuo |
| `ac_06` | **Endpoints / estaciones de trabajo** | Windows, macOS, Linux | Agente ligero | Continuo |

**El cliente elige una plataforma, no una categoría (D67).** Es lo que muestra la pantalla, como un marketplace: cada plataforma con su logo y su propio paso a paso. En servidores y
equipos la plataforma es el **sistema operativo**; en bases de datos, el **motor**. Dónde vive (EC2, Azure VM, RDS, Cloud SQL, Atlas, un VPS) no se pregunta: lo dice la plataforma que el cliente elige (D92; la hoja del comité lo resolvía con el escenario de despliegue). Cada plataforma tiene `availability`: solo las `available` se pueden elegir, las `coming_soon` se muestran **bloqueadas**. Hoy solo AWS está disponible.

**Las reglas del paso 3 son datos, no constantes de código (D67):** con qué
frecuencia corre cada una (`capability_frequencies`), qué canales admite cada plataforma (`platform_connection_methods`; el recomendado va marcado), qué regiones puede declarar el
cliente (`platform_regions`) y qué tipo de activo produce cada conexión (`automated_capabilities.asset_type`). Todas viven en `catalog`: se leen libre y solo `admin_monkey` las escribe
(SEG-06), y nacen con las políticas del catálogo (SEG-05). Los enums que comparten catálogo y tenant (`connection_method`, `schedule_frequency`, `asset_type`) son del Backend: dónde se
declaran es un detalle de `schema-implementacion.md`.

Solo nube → `ac_01` · nube con servidores → `ac_01`+`ac_02`+`ac_03` · on-premise → `ac_04`+`ac_05`+`ac_06` · híbrido → **las seis** (el cliente usa las que le sirvan, D46).

**El tipo del activo se deduce de la conexión** con que se registra (D46; hoy en `automated_capabilities.asset_type`, D67): `ac_01` servicio en nube ·
`ac_02`/`ac_04` servidor · `ac_03`/`ac_05` base de datos · `ac_06` endpoint. El cliente ya no declara cuántos
activos tiene (D60): los ve al conectar.

**Honestidad: Automatizado ≠ Operativo.** Mientras la comprobación no sea real (fuera del modo `runner` de la nube, D58), una conexión no puede declararse
`operational`: la comprobación está `unavailable` (503, el activo sigue `pending`) o `simulated` (solo
desarrollo y demostración, el activo queda en `warning`). Ver D46.

**El flujo de cada conexión es conectar → validar → activar → programar.**

> **Cambios al schema:** el enum de `assets.type` gana `application`, `documentation` y
> `endpoint`. `network_device` y `endpoint` se monitorean pero **no son dimensiones**.

---
