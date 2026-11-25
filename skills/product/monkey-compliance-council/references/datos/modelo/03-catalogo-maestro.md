# Modelo de datos — §3 Catálogo maestro

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Marcos, requisitos, controles, requisitos del control, pruebas, checks, documentos, riesgos y causas; versionado y clonado. **Léelo:** Antes de tocar el catálogo, el control atómico o el clonado.
> Los números de sección (§) se conservan: cualquier cita a «§3» apunta aquí.

## 3. Catálogo maestro

**Qué es:** todo lo que Monkey administra y que existe **antes de que haya un solo cliente**: los marcos con sus
requisitos, los controles con sus requisitos del control, las pruebas y los checks que las automatizan, los
documentos sugeridos y el catálogo base de riesgos y causas. Lo cura el equipo de Monkey desde Monkey Admin.

**Por qué importa:** cuando un cliente contrata un marco no se le inventa nada: hereda este catálogo y lo
particulariza. Y como el catálogo cambia con el tiempo, se versiona.

**La fuente es la VF18 del comité, catálogo v2** (D128, D129). La tabla 7 de su hoja `01_DESARROLLO` mapea cada
columna del libro a una tabla de aquí; los nombres de las tablas nuevas están fijados en
el contrato de la carga ([`catalogo-maestro.md`](../../../../../../contracts/catalogo-maestro.md#carga-del-catálogo-v2-rc-01), RC-01, MD-491). Totales y reglas de integridad que la carga valida: §0.

### 3.1 El marco y sus requisitos

```mermaid
erDiagram
    frameworks {
        uuid id PK
        string code "7 ofrecidos; solo soc2 construido (D50)"
        string name
        string version
        enum type
        string scope_description
        enum availability "available | coming_soon (D50)"
    }
    requirements {
        uuid id PK
        uuid framework_id FK
        uuid trust_criterion_id FK
        string code "TSC Ref: CC6.1"
        string tsc_category "Categoria TSC (nombre largo)"
        text criterion
    }
    points_of_focus {
        uuid id PK
        uuid requirement_id FK
        int number "POC #"
        text description
    }
    requirement_relations {
        uuid id PK
        uuid source_requirement_id FK
        uuid related_requirement_id FK
    }
    trust_criteria {
        uuid id PK
        enum criterion "security|availability|confidentiality|integrity|privacy"
        boolean is_mandatory "true solo en security"
    }
    frameworks ||--o{ requirements : "exige"
    requirements ||--o{ points_of_focus : "precisa"
    requirements ||--o{ requirement_relations : "se relaciona con"
    trust_criteria ||--o{ requirements : "clasifica"
```

**Sin cambios en la v2:** 61 criterios TSC y 302 puntos de enfoque (`8_MATRIZ_MAESTRA`). **El punto de enfoque es
el punto de anclaje**: el control se vincula al punto de enfoque, no al marco ni al requisito. Cada punto de enfoque
tiene al menos un control (`IN-01`).

### 3.2 El control, sus requisitos y su desacople del marco

```mermaid
erDiagram
    controls {
        uuid id PK
        string code "IDA-11, GOB-7"
        string name
        text description
        string domain "nulo en la v2: el dominio es de la fila (point_of_focus_controls)"
        enum type "manual|it_dependent_manual|automated"
        enum periodicity "sugerida; el cliente la cambia (G-10)"
        text suggested_owner_role "2-3 cargos alternativos, guia (IN-09)"
    }
    point_of_focus_controls {
        uuid id PK
        uuid point_of_focus_id FK
        uuid control_id FK
        string domain "uno de 25, valor literal del comite"
    }
    control_dimensions {
        uuid id PK
        uuid control_id FK
        enum dimension "9 valores (§2)"
    }
    control_requirements {
        uuid id PK
        uuid control_id FK
        string code "IDA-11-L3"
        int point_number "Punto L"
        text text
        enum type "documentary|population|operational|technical"
        enum periodicity "sugerida"
        boolean is_mandatory
    }
    control_requirement_tests {
        uuid id PK
        uuid control_requirement_id FK
        uuid test_id FK
    }
    control_requirement_documents {
        uuid id PK
        uuid control_requirement_id FK
        uuid document_id FK
    }
    control_documents {
        uuid id PK
        uuid control_id FK
        uuid document_id FK
    }
    control_framework_mappings {
        uuid id PK
        uuid control_id FK
        string framework_code
        string requirement_ref "A1.1 POC 1"
        enum relation_type "direct"
        text justification
    }
    controls ||--o{ point_of_focus_controls : "satisface"
    points_of_focus ||--o{ point_of_focus_controls : "satisfecho por"
    controls ||--o{ control_dimensions : "se evalua en"
    controls ||--|{ control_requirements : "se prueba con"
    control_requirements ||--|{ control_requirement_tests : "probado por"
    control_requirements ||--o{ control_requirement_documents : "pide"
    controls ||--|{ control_documents : "depende de"
    controls ||--o{ control_framework_mappings : "responde a"
```

**El desacople es la regla estructural del modelo:** el control **no pertenece a ningún marco**. Se vincula a
puntos de enfoque (`N:M`): en la hoja `Controles Monkey` cada fila es la combinación control + criterio + punto
de enfoque, y el control se repite con los mismos datos (114 controles en 472 filas; `IN-08` exige que coincidan).
`control_framework_mappings` (`MAPEO_MARCOS`) registra a qué requisito de cada marco responde cada control: hoy
solo SOC 2 (472 filas, todas directas) y, después, ISO 27001 y los demás. Así una evidencia sirve en todos los
marcos donde el control aplica (P2 del libro).

**El requisito del control es la unidad de cálculo** (D129, §9). Son los puntos de la columna L («Documentos /
evidencias documentales requeridas»), uno por fila en la hoja `REQUISITOS`: 576, todos obligatorios, de cuatro
tipos (232 documentales, 244 operativos, 97 técnicos y 3 de población). Cada uno tiene al menos un test (`IN-04`).
**No confundirlo con `requirements`**, que es el criterio del marco.

**Del control:** el **tipo** (64 manuales,
12 manuales dependientes de TI, 38 automáticos: dice cómo opera y **no cambia el cálculo**), la **periodicidad
sugerida** (40 permanentes, 36 cuando sea requerido, 28 anuales, 4 semestrales, 3 mensuales, 3 trimestrales) y el
**rol responsable sugerido**, que es solo una guía: cada empresa asigna a sus usuarios (G-01). El **dominio** (25 valores literales) **es de la fila** control + punto de enfoque, no del control: 61 controles tienen 2 a 4 dominios distintos y `IN-08` no exige que coincidan (MD-491). Las **dimensiones**
vienen explícitas en las columnas «TEST …» de la hoja: el control aplica las que dicen «Definido» (las 114
aplican la documental). Desde MD-499 la carga suma además una fila por cada dimensión en que el control tenga pruebas y la hoja no marque (en la práctica `process`): 267 filas de «Definido» + 107 de `process` = **374** `control_dimensions`. La columna «EVALUACIÓN DE CONTROL» es un resultado por cliente y no se carga.

**Prefijos de código de la v2:** `ACT`, `AEV`, `CAP`, `CFG`, `CHG`, `CIF`, `CLI`, `CNT`, `CON`, `CPL`, `DCL`, `EQU`,
`FIS`, `GOB`, `IDA`, `INC`, `MNT`, `MOV`, `OPS`, `PRV`, `RED`, `RIE`, `RRH`, `TER`, `TRD`, `VUL`. No tienen equivalencia
oficial con los de la v1 (DEV-02).

**Un control depende de sus documentos.** Los 42 documentos del catálogo y sus 228 vínculos con controles están en
§11 (`catalog.documents`, D133): reemplazan a `policies` y a `evidence_templates` de la v1. Cada documento tiene su
prueba documental (`IN-05`).

### 3.3 Pruebas, procedimientos, integraciones y checks

```mermaid
erDiagram
    tests {
        uuid id PK
        string code "T-IDA-11-04, T-DOC-POL001"
        uuid control_id FK "nullable: las T-DOC son del documento"
        enum type "documentary|population|operational|technical"
        enum dimension "9 valores"
        string display_name "nombre neutro que ve el cliente (D70)"
        string display_name_en "nulo si falta (D142)"
        text display_description "D82"
        text objective "Que se asegura"
        text why_it_matters
        enum primary_source "document|manual|probe|cloud_engine|probe_and_cloud_engine|integration"
        uuid standard_procedure_id FK
        text step_by_step
        text correct_if
        text exception_if
        text observation_if
        text evidence_to_retain
        enum level "design|implementation|effectiveness|implementation_and_effectiveness"
        text frequency_sample "texto"
        uuid integration_category_id FK "nullable"
        enum automation "manual|semi_automated|automated"
    }
    standard_procedures {
        uuid id PK
        string code "PE-TEC-01"
        string name
        text when_used
        text generic_steps
        text typical_evidence
    }
    integration_categories {
        uuid id PK
        string name "Proveedores de identidad, Ticketing..."
        text example_tools
        text evidence_provided
    }
    integration_category_controls {
        uuid id PK
        uuid integration_category_id FK
        uuid control_id FK
    }
    checks {
        uuid id PK
        string platform
        string policy_id
        string check_id
        string title_es
        string title_en
        text condition
        text remediation
        text remediation_es
        text verification_rule
        string engine_severity "solo nube"
        uuid sca_policy_id FK "nullable"
    }
    test_checks {
        uuid id PK
        uuid test_id FK
        uuid check_id FK
        enum role "direct|complementary|dependency"
        text common_objective
        uuid owner_control_id FK "nullable: el dueno de una dependencia"
        text applies_when
        string module_ref "solo los 19 N/A, check_id nulo (D141)"
        enum provenance "committee_ratified en la v2"
    }
    check_mappings {
        uuid id PK
        uuid check_id FK
        string framework_code
        string framework_version
        string requirement_code
        enum provenance
    }
    sca_policies {
        uuid id PK
        string platform
        string benchmark
        string sca_id
        string yaml_file
        int check_count
    }
    controls ||--o{ tests : "se prueba con"
    standard_procedures ||--o{ tests : "guia"
    integration_categories ||--o{ tests : "aporta evidencia a"
    integration_categories ||--o{ integration_category_controls : "alimenta"
    tests ||--o{ test_checks : "se automatiza con"
    checks ||--o{ test_checks : "usado por"
    checks ||--o{ check_mappings : "mapea a"
    sca_policies ||--o{ checks : "contiene"
```

**La prueba pertenece a un control** (D129): 430 pruebas `T-<control>-nn`, una o varias por requisito, y 42
documentales `T-DOC-…`, **una por documento**, que no llevan control y se vinculan por el documento. En total 472:
43 documentales (las 42 `T-DOC` más `T-OPS-1-01`), 38 de población, 237 operativas y 154 técnicas. Por dimensión:
proceso 275, documental 43, nube 36, BD 29, servidores 28, aplicación 23, red 22, endpoint 12, físico y ambiental 4.
`control_tests` (N:M de la v1) se retira: la relación es `tests.control_id` y, para lo que prueba cada una,
`control_requirement_tests` (161 pruebas cubren varios puntos de L, así que no cabe en una columna). Mientras el
código v1 siga vivo, la carga alimenta `control_tests` como puente (`contracts/catalogo-maestro.md`, MD-491).

**Procedimientos estándar** (`PROCEDIMIENTOS`, 8): `PE-DOC-01` documental, `PE-POB-01` población, `PE-TEC-01`
check automático, `PE-TEC-02` técnico manual, `PE-MUE-01` muestra operativa, `PE-ACC-01` listado de accesos,
`PE-EXC-01` evaluación de fallos e `PE-INT-01` evidencia por integración. **Categorías de integración**
(`INTEGRACIONES`, 14): proveedores de identidad, RR. HH., verificación de antecedentes, capacitación, control de
versiones, ticketing, MDM, escáneres de vulnerabilidades, logs y SIEM, gestores de contraseñas, nube, DLP,
finanzas y CRM, y consentimiento y cookies; cada una con los controles que alimenta y la evidencia que aporta.

**Las pruebas son texto interno.** 126 de las 472 nombran a los proveedores de la sonda o del motor de nube en
algún campo: nada de eso sale tal cual a la UI, a un reporte ni a un texto generado por IA. El cliente ve el nombre y
la descripción neutros que escribe Monkey (D70, D82) y la tabla 9 de `01_DESARROLLO` (D128). La columna `Estado`
de la hoja `TEST` no se carga.

**El rol del check** (D129, `TEST_CHECKS`, 4.684 vínculos para 117 pruebas): **Directo** (1.728: decide el
cumplimiento), **Complementario** (2.001: solo observación) o **Dependencia** (955: toma la conclusión del control
dueño, `owner_control_id`, sacado del objetivo común «dueño CIF-3»; `IN-06` exige que el check sea Directo en el
dueño). `applies_when` dice cuándo aplica («Cliente conecta AWS», «Agente con la política …»). **Un mismo check es
Directo en un solo control** (`IN-07`). Todos entran como `committee_ratified` (DEV-12): ya no hay propuestas de
desarrollo ni confianza calculada (D56). Diecinueve vínculos tienen check ID `N/A`: son módulos de la sonda o
puntajes globales, no checks. Se cargan con `check_id` nulo y `module_ref` (MD-491). Un módulo pasa si no hay hallazgos críticos ni altos abiertos; un puntaje, con 80 % o más (D141, D146).

**La clave del check** es plataforma + check ID en el motor de nube y política + check ID en la sonda (DEV-11); en
el modelo, `platform` + `policy_id` + `check_id`. `TEST_CHECKS` trae el **nombre** de la política y el cruce con
`sca_policies` se hace por ese nombre. Los catálogos: la **sonda 4.14.7** (11.352 checks, 77 políticas, 18
plataformas, con título en español para todos y remediación en español para 218) y el **motor de nube 5.45.0**
(1.621 checks en 20 plataformas: AWS, Azure, Microsoft 365, GCP, Kubernetes, Alibaba Cloud, Google Workspace,
Oracle Cloud, OpenStack, Cloudflare, Okta, E2E Networks, GitHub, Huawei Cloud, Vercel, Linode, MongoDB Atlas,
STACKIT, NHN Cloud y Scaleway, con su severidad). Ambos traen columnas de mapeo a otros marcos, que van a
`check_mappings`. **Solo cuenta para el cumplimiento un check vinculado en `TEST_CHECKS`**: lo demás es catálogo.

**Cinco estados del check de la sonda** tal como llegan: `passed`, `failed`, `invalid`, `not_applicable` y `not_run`.
Cómo se convierten en los estados del libro (PASS, FAIL, FAIL con excepción, No aplica, Sin datos): §9.

### 3.4 Riesgos y causas (catálogo base)

```mermaid
erDiagram
    risks {
        uuid id PK
        string code "R001"
        string name
        text description
        enum trust_criterion "categoria del riesgo, 11 valores: NO son los 5 TSC"
        json potential_impact "tipos de perdida"
        int likelihood "inherente, 1-5"
        int impact "inherente, 1-5"
        int inherent_risk_value "1-25"
        enum inherent_risk_level "por posicion en la matriz (D134)"
        boolean is_active
    }
    causes {
        uuid id PK
        string code "F001"
        enum origin "internal|external"
        enum cause_type "18 valores"
        text description
    }
    risk_causes {
        uuid id PK
        uuid risk_id FK
        uuid cause_id FK
    }
    cause_controls {
        uuid id PK
        uuid cause_id FK
        uuid control_id FK
    }
    risks ||--o{ risk_causes : "originado por"
    causes ||--o{ risk_causes : "origina"
    causes ||--o{ cause_controls : "mitigada por"
    controls ||--o{ cause_controls : "mitiga"
```

**Los tres niveles se reutilizan** y las relaciones son `N:M`: 10 riesgos y **100 causas** unidos por **551
relaciones** riesgo↔causa, y **771** causa→control. Todas las causas tienen riesgo y control, y todos los controles
tienen causa (`IN-02`, `IN-03`). La fuente de verdad de los dos vínculos es la hoja `Causas`; las relaciones ya no
tienen código. La causa tiene **origen** (84 internas, 16 externas) y **tipo** (18 valores: humano, procesos y
métodos, tecnológico…), y no tiene nombre corto: se muestra la descripción. `cause_controls` ya no lleva efecto ni
obligatoriedad: el residual se calcula por cobertura (D134).

**El riesgo trae su valoración inherente** (D134): probabilidad e impacto (en el libro son texto, «4 - Probable»: se
carga el número), su valor y su **nivel según la posición en la matriz**, no por rangos. Llega prellenada al
asistente de riesgos del servicio, donde el cliente la confirma o la ajusta. La categoría del riesgo
(`trust_criterion`) tiene **11 valores** — Confidencialidad, Integridad, Disponibilidad, Privacidad, Cumplimiento,
Seguridad, Continuidad, Terceros, Fraude, Reputación y Operación —, que **no son los 5 TSC** (D33); los 10 riesgos
usan siete. `potential_impact` son solo **tipos de pérdida** (comentario de la hoja `Riesgos`).

**El riesgo cuelga del servicio, no del marco** (§7.2), y **este catálogo es solo la plantilla**: al elegir marco se
copia a `client_risks` y `client_causes`, y lo que un cliente cambie solo lo ve él (D28).

### 3.5 Versionado del catálogo y qué se clona

```mermaid
erDiagram
    catalog_versions {
        uuid id PK
        int number "la VF18 es la 2"
        date published_at
        text change_summary
        uuid published_by FK "nullable: la carga inicial la hace un script"
        boolean propagated_automatically
        boolean requires_acceptance
    }
```

**El catálogo se versiona y cada evaluación guarda contra qué versión se midió** (A4). **La v2 no convive con la
v1** (D128): el entorno de desarrollo se recrea y la v2 se carga sola, porque los datos que había son de prueba.
Las filas del catálogo todavía no llevan versión propia; hará falta cuando haya clientes reales y llegue una v3,
porque entre versiones se repiten códigos con otro significado.

**Qué se clona al escenario del cliente y qué no:**

| Elemento | ¿Se clona? |
|---|---|
| `controls` → `client_controls` | **Sí**: el cliente reescribe su interpretación (D3), crea controles propios, los da de baja y **cambia la periodicidad** con justificación (G-10). Ver §7 |
| `control_requirements` → los requisitos del control del cliente | **Sí**, por control del cliente: ahí viven su periodicidad configurada y su «No aplica» con justificación aprobada (§7). Reemplazan a `evidence_requirements`, que nacían de plantillas |
| `control_dimensions` → `client_control_dimensions` | **Sí** (D36) |
| `documents` → los documentos de la empresa | **Sí, por empresa y no por servicio**: un documento sirve a varios controles y servicios, con un responsable, versiones, aprobación y aceptación (§11, D133) |
| `risks` y `causes` → `client_risks` y `client_causes` | **Sí**, con sus relaciones, al elegir marco; la valoración inherente llega prellenada (D134) |
| `requirements`, `points_of_focus` y `tests` | **No: se referencian con FK real.** El cliente no reescribe un estándar ni una prueba |
| `test_checks`, procedimientos, categorías de integración, mapeo a marcos | **No**: son catálogo y se leen |

**Qué se propaga solo y qué requiere aceptación del `admin_empresa` (D96):**

| Tipo de cambio en el catálogo | Se propaga solo | Requiere aceptación |
|---|---|---|
| Corrección de redacción | ✅ | |
| Control nuevo | ✅ | |
| Cambio en cómo se mide un control (requisitos, pruebas, dimensiones, rol de un check) | | ✅ |
| Control que se elimina | | ✅ |

**Un control nuevo no baja el porcentaje a mitad de camino:** entra a contar desde el **siguiente período de
evaluación**.

---
