# Modelo de datos — §7 Cumplimiento

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Control del cliente, riesgos, evidencias, evaluaciones y observaciones. **Léelo:** Antes de tocar controles del cliente, evidencias o hallazgos.
> Los números de sección (§) se conservan: cualquier cita a «§7» apunta aquí.

## 7. Módulo Cumplimiento

**Qué es:** donde el cliente trabaja su cumplimiento día a día — ajusta los controles que
heredó, sube evidencia, gestiona riesgos y remedia hallazgos.

**Qué resuelve:** el catálogo clonado es genérico; el cumplimiento real exige decir *"este
control, en mi empresa, se cumple con estas herramientas concretas"*.

**No bloquea nada** (decisión D23, confirmada por el comité el 2026-09-26). Un cliente
que termina el onboarding ya tiene
cumplimiento midiéndose con el catálogo por defecto; este módulo es donde lo afina, sin
límite de tiempo. Lo usa `admin_empresa`.

### 7.1 El control del cliente

```mermaid
erDiagram
    client_controls {
        uuid id PK
        uuid control_id FK "nullable: null si lo creo el cliente"
        uuid service_id FK
        string own_code "C01"
        string name "nullable: solo en un control propio; en uno del catalogo sale de controls.name (D79)"
        enum trust_criterion "nullable: la categoria de un control propio, la elige el cliente"
        text client_interpretation
        enum type
        string source_ref
        boolean is_active "baja logica"
    }
    client_control_changes {
        uuid id PK
        uuid tenant_id FK
        uuid service_id FK
        uuid client_control_id FK
        enum change_type "create|retire|edit_dimensions|edit_interpretation"
        json proposed_values "lo que se propone"
        enum status "pending|approved|rejected"
        uuid requested_by FK
        uuid decided_by FK "nullable, el consultor"
        text decision_note "nullable"
        datetime requested_at
        datetime decided_at "nullable"
    }
    client_control_dimensions {
        uuid id PK
        uuid client_control_id FK
        enum dimension
        enum type "manual|automated|hybrid|technical_manual"
        boolean requires_probe
        boolean requires_ai
        boolean requires_compliance_confirmation
        text reason_not_applicable "nullable"
    }
    client_control_tests {
        uuid id PK
        uuid client_control_id FK
        uuid test_id FK
        boolean is_mandatory "si es No, no cuenta para el control (RN-12)"
        boolean is_active "vigente; si es No, no cuenta (desactivacion controlada)"
        date valid_from "alta"
        date valid_to "nullable, baja"
        text deactivation_reason "nullable, obligatoria al desactivar"
        uuid deactivated_by FK "nullable"
    }
    action_plans {
        uuid id PK
        uuid client_control_id FK
        uuid responsible_id FK
        text action_description
        date due_date
        enum status
    }
    controls ||--o{ client_controls : "particularizado en"
    services ||--o{ client_controls : "aplica"
    client_controls ||--o{ client_control_changes : "se modifica con"
    client_controls ||--o{ action_plans : "remediado con"
    client_controls ||--o{ user_control_assignments : "asignado a"
    client_controls ||--o{ client_control_dimensions : "se evalua en"
    client_controls ||--o{ client_control_tests : "se verifica con"
    tests ||--o{ client_control_tests : "verifica a"
```

**`client_controls` es tabla propia, no columnas extra del control clonado** (decisión D3). El
cliente reescribe la interpretación con sus herramientas reales, y el `source_ref` mantiene el
rastro al control del catálogo para que una actualización del catálogo sepa a quién afecta.

**El mismo control puede estar cumplido en un servicio e incumplido en otro**, porque se
evalúa sobre insumos distintos. Por eso `client_controls` cuelga del servicio.

**El cliente puede proponer crear, editar y dar de baja controles** (matriz §5.5), y por eso todo lo que se mide
cuelga de `client_controls` y no del catálogo: `evaluations` (§7.4) y `evidence_requirements` (§7.3)
apuntan a `client_control_id`. `control_id` es la plantilla de origen y es nulo en un control propio.
**Eliminar es dar de baja** (`is_active = false`): las evaluaciones son inmutables y las FK son
`RESTRICT`, así que un control con histórico no se borra. Lo mismo vale para `client_causes` y
`client_risks`.

**Un control propio es solo documental** (su única dimensión es `policy`, tipo `manual`) y **lo ubica el cliente en una categoría** (`trust_criterion`). No tiene
punto de enfoque (el puente `point_of_focus_controls` es del catálogo): cuenta para el porcentaje de su categoría y del marco, pero no cierra ningún requisito (D65).

**`own_code`** es el código del catálogo (`IAC-12`) en un control clonado y la numeración propia (`C01…`) en uno que creó la empresa; el código se muestra siempre, también al cliente (D80); el backend aún lo manda solo dentro de `technical` (ver el pendiente D80 de `compliance-controls.md`). Un control propio lleva además `name` y `trust_criterion` (D79).

**Los cambios de controles los decide el consultor** (D65). Crear un control propio, darlo de baja y editar las dimensiones o la interpretación de un control —del
catálogo o propio— son **propuestas** (`client_control_changes`) que la empresa hace y el consultor aprueba o rechaza:

- **Crear:** el control existe desde que se propone y **cuenta en el porcentaje mientras está pendiente**. Si el consultor lo rechaza, se da de baja y deja de contar.
- **Dar de baja y editar:** el control sigue como estaba (y contando) hasta que el consultor aprueba; entonces se aplica el cambio.
- **Una propuesta pendiente por tipo y por control** (índice único parcial), y una decidida lleva quién y cuándo; rechazar exige motivo (restricciones de la base).

### 7.2 Riesgos del cliente y sus indicadores

```mermaid
erDiagram
    client_risks {
        uuid id PK
        uuid tenant_id FK
        uuid service_id FK
        uuid risk_id FK "nullable: null si lo creo el cliente"
        string code "R001"
        string name
        text description
        enum trust_criterion
        json potential_impact
        int likelihood "5x5, lo llena el cliente"
        int impact "5x5, lo llena el cliente"
        int inherent_risk_value "probabilidad x impacto"
        enum inherent_risk_level "low|moderate|high|critical"
        boolean is_active
        datetime created_at
        datetime updated_at
    }
    client_causes {
        uuid id PK
        uuid tenant_id FK
        uuid service_id FK
        uuid cause_id FK "nullable: null si la creo el cliente"
        string code "F001"
        string name
        enum failure_category
        text description
        boolean is_active "baja logica"
        datetime created_at
        datetime updated_at
    }
    client_risk_causes {
        uuid id PK
        uuid tenant_id FK
        uuid client_risk_id FK
        uuid client_cause_id FK
    }
    client_cause_controls {
        uuid id PK
        uuid tenant_id FK
        uuid client_cause_id FK
        uuid client_control_id FK
        boolean is_mandatory "D75"
        enum effect "probability|impact (D75)"
    }
    residual_parameters {
        uuid id PK
        uuid tenant_id FK
        uuid service_id FK "nullable: por servicio o global, aun abierto (P22)"
        int max_probability_reduction "2 por defecto (D75)"
        int max_impact_reduction "1 por defecto"
        int risk_appetite "9 de 25 por defecto"
        enum status "proposed|approved"
    }
    mitigations {
        uuid id PK
        uuid client_cause_id FK "nullable"
        uuid client_risk_id FK "nullable"
        decimal response_percentage
        date calculated_at
    }
    residual_risks {
        uuid id PK
        uuid client_risk_id FK
        uuid accepted_by FK
        enum residual_level
        text justification
        date accepted_at
    }
    risk_treatments {
        uuid id PK
        uuid client_risk_id FK
        uuid responsible_id FK "organization_responsibles: un cargo, no una persona (D30)"
        enum decision "mitigate|accept|transfer|avoid"
        date due_date
        uuid created_by FK "quien registró la decisión"
        datetime created_at "la decisión vigente es la última"
    }
    services ||--o{ client_risks : "expuesto a"
    services ||--o{ client_causes : "tiene"
    risks ||--o{ client_risks : "plantilla de"
    causes ||--o{ client_causes : "plantilla de"
    client_risks ||--o{ client_risk_causes : "originado por"
    client_causes ||--o{ client_risk_causes : "origina"
    client_causes ||--o{ client_cause_controls : "mitigada por"
    client_controls ||--o{ client_cause_controls : "mitiga"
    client_risks ||--o{ mitigations : "responde con"
    client_causes ||--o{ mitigations : "responde con"
    client_risks ||--o{ residual_risks : "deja"
    client_risks ||--o{ risk_treatments : "se trata con"
```

**El impacto potencial de un riesgo se guarda como el texto que trae el comité** (`["Reputacional", "Sanción regulatoria"]`), igual en el catálogo y en lo que crea la empresa; la API lo expone como valores `loss_type` (`contracts/enums.md`).

**Cada cliente trabaja sobre su propia copia** (decisión D28). Al crearse `service_frameworks`
se copian los riesgos y causas base a `client_risks` y `client_causes` **de ese servicio**, con
sus relaciones (`client_risk_causes` replica `risk_causes`; `client_cause_controls` replica
`cause_controls` (con `is_mandatory` y `effect`, D75) pero apuntando al control **del cliente**, `client_controls`, que es el que él
particulariza). `risk_id` / `cause_id` guardan la plantilla de origen —para que una actualización
del catálogo sepa a quién afecta (§3.5)— y son `null` en lo que el cliente creó desde cero.

Por eso **editar o eliminar un riesgo o una causa no afecta al catálogo ni a ningún otro
cliente**: cada uno ve lo que tiene. Es lo que permite lo que dice el comité, que en este
módulo el cliente "crea, edita y elimina riesgos y causas según su propio entendimiento".

**Los tres indicadores no se mezclan** (reglas R-11 y R-12): cumplimiento (controles frente
al marco), mitigación (respuesta frente a una causa o riesgo) y riesgo residual son
**cálculos separados**. Un 93% de cumplimiento no dice que el riesgo residual sea del 7%.
`mitigations` apunta a **exactamente una** de las dos, causa o riesgo (hay un `CHECK`).

### 7.3 Evidencias

```mermaid
erDiagram
    evidence_requirements {
        uuid id PK
        uuid client_control_id FK
        uuid responsible_id FK "cargo, no persona"
        string code
        int sequence
        text description
        enum dimension
        string validity_within_period
        string source_ref "nullable: codigo de la plantilla; null si la creo el cliente"
    }
    evidence_submissions {
        uuid id PK
        uuid evidence_requirement_id FK
        uuid submitted_by FK
        uuid approved_by FK "solo admin_empresa"
        datetime submitted_at "D79"
        datetime approved_at "nullable, D79"
        text decision_note "nullable, obligatoria al rechazar (D79)"
        string file_path
        string file_type
        int file_size
        string storage_location
        string integrity_hash
        string version
        enum validation_status
        text ai_verdict "etiquetado como generado por IA"
        boolean type_ok "atributos de la evidencia (RN-01); nulo = sin revisar"
        boolean period_ok "la fecha cae dentro del periodo"
        boolean valid_ok "vigente; en No es EVIDENCIA VENCIDA (RN-02)"
        boolean approved_ok "aprobacion del documento"
        boolean signed_ok "firma o autorizacion"
        boolean content_ok "contenido obligatorio"
        enum review "pending_review|ai_prevalidated|human_validated (RN-03)"
    }
    exclusions {
        uuid id PK
        uuid test_id FK
        uuid asset_id FK "nullable: si excluye un activo de ese test (D68, REQ-008)"
        uuid proposed_by FK "admin_empresa"
        uuid decided_by FK "nullable, el consultor (antes approved_by, D79)"
        enum status "pending|approved|rejected (D79)"
        datetime requested_at "D79"
        datetime decided_at "nullable"
        text decision_note "nullable, obligatoria al rechazar"
        text technical_justification "nullable, obligatoria si el test es automatico"
        string excluded_check_id "nullable: si excluye un check"
        text justification
        date valid_from
        date valid_until
    }
    client_controls ||--o{ evidence_requirements : "exige"
    evidence_requirements ||--o{ evidence_submissions : "se cumple con"
    tests ||--o{ exclusions : "excluye checks por"
```

**Lo que D68 agrega a estas tablas** (la regla está en §9): `client_control_tests` lleva *obligatorio*, *vigente*, fechas y la justificación de una desactivación; `evidence_submissions` guarda los seis atributos que se
validan por evidencia y la **revisión** (`pending_review`, `ai_prevalidated`, `human_validated`), de donde se **deriva** su estado (`evidence_state`). **`validation_status` sigue siendo la aprobación de la empresa**
(solo `admin_empresa`) y no es el estado de cumplimiento de la evidencia. `exclusions` puede excluir un **activo** de un test además de un check, siempre con justificación, aprobador y vigencia. Un `evaluations.result` ahora
distingue `error` y `excluded`.

**El responsable de la evidencia es cargo *y* persona, en planos distintos** (decisión A1):
`evidence_requirements.responsible_id` apunta a `organization_responsibles`, es decir, al
**cargo** dentro de la organización del cliente (§5.4); quién lo ocupa hoy es su `person_name`.
Se cerró así en D30 (P4): no hay catálogo global de cargos, y `evidence_requirements` se
clona con el `responsible_id` vacío hasta que el cliente designa a sus responsables. Se clonan desde
`evidence_templates` (§3.2), una fila por plantilla ligada al control, con `code` = código de la
plantilla, `sequence` = su orden en el control y `validity_within_period` = el periodo de evaluación.

**La evidencia es válida si cae dentro del periodo de evaluación** del marco (decisión C1), no
por una fecha de caducidad fija.

**La exclusión la propone la empresa (`admin_empresa`) y la aprueba el consultor (rol `consultor`), y vence** (D78, que invirtió A3). Una
exclusión sin justificación aprobada no cambia el denominador — y un check que sale por
omisión es un agujero, no una exclusión.

**Solo `admin_empresa` aprueba evidencia.** La IA puede sugerir un veredicto (`ai_verdict`),
siempre etiquetado como generado por IA, pero **nunca cierra un control**.

### 7.4 Evaluaciones y hallazgos (el histórico)

```mermaid
erDiagram
    evaluations {
        uuid id PK
        uuid service_id FK
        uuid client_control_id FK "el control DEL CLIENTE que se evaluo"
        uuid test_id FK "que test se evaluo"
        uuid check_id FK "nullable, el check exacto si lo midio la sonda"
        uuid asset_id FK
        uuid catalog_version_id FK
        uuid confirmed_by FK "nullable"
        datetime evaluated_at
        enum dimension
        enum result "compliant|non_compliant|pending|error|excluded|not_applicable (D68)"
        enum raw_probe_result "ok|fail"
        decimal diagnostic_percentage
        enum origin
        text client_response "si es manual"
        text consultant_assessment "si es manual"
        text closure_observation_reason
        string covered_period
    }
    findings {
        uuid id PK
        uuid evaluation_id FK
        uuid asset_id FK
        enum dimension
        string failed_test_or_check
        enum severity
        enum status "open|remediated|excluded"
        date detected_at
        date closed_at "nullable"
    }
    compliance_events {
        uuid id PK
        uuid user_id FK
        string changed_field
        json previous_value
        json new_value
        string ip_address
        string user_agent
        datetime created_at
    }
    vulnerabilities {
        uuid id PK
        uuid asset_id FK
        string cve
        enum severity
        string package_name
        string package_version
        decimal cvss_score
        enum status "active|solved|mitigated"
        text recommendation
    }
    services ||--o{ evaluations : "evaluado en"
    client_controls ||--o{ evaluations : "registra"
    tests ||--o{ evaluations : "aplicado en"
    checks ||--o{ evaluations : "aplicado en"
    assets ||--o{ evaluations : "sobre"
    catalog_versions ||--o{ evaluations : "medida contra"
    evaluations ||--o{ findings : "detecta"
    assets ||--o{ vulnerabilities : "expone"
```

**Una evaluación dice qué se evaluó** (D27, D36): el control del cliente (`client_control_id`), `test_id` siempre —el test es lo que define la
dimensión y a qué exclusiones responde— y `check_id` cuando la midió la sonda. Sin esos dos campos
no se puede "señalar el activo y el check exactos" de una falla (§9). `evaluated_at` es un
**instante**, no un día: la sonda corre cada 6 horas y "la última evaluación" tiene que ser
inequívoca.

**Cuatro reglas que no se negocian:**

- **La evaluación es inmutable.** Una nueva se agrega, no pisa la anterior. Es lo que permite
  demostrar cumplimiento **durante un periodo**, requisito de SOC 2 Tipo II. La base lo impone:
  el rol de la app **no puede `DELETE`** y solo puede hacer `UPDATE` de `confirmed_by` y
  `closure_observation_reason` — el cierre humano de §7.5, que no cambia lo medido (D27).
- **El estado no puede vivir en la definición.** Hoy `ManualCheckItem` lleva `status` y
  `evaluated_at` en la misma fila que la definición: evaluar pisa la evaluación anterior. Eso
  se corrige separando definición de evaluación.
- **Se guarda el dato crudo junto a la interpretación.** La sonda dice `ok`/`fail`
  (`raw_probe_result`); Monkey dice `compliant`/`non_compliant` (`result`). Sobrescribir el
  crudo haría imposible auditar el veredicto.
- **El hallazgo lo detecta el sistema, nunca una persona** (D63). Lo que el auditor escribe a mano es una
  **observación** (§7.6), que es otra tabla y otro ciclo de vida.

**`compliance_events` y `audit_logs` son dos tablas distintas.** `audit_logs` (§5.2) registra
acciones sobre la plataforma (quién cambió qué en el sistema); `compliance_events` registra
cambios en el estado de cumplimiento. Las dos son **append-only, 7 años, inmutables**.

**Las vulnerabilidades son solo insumo en el MVP** (decisión D7): alimentan los hallazgos de
los controles de gestión de vulnerabilidades y parches (`CC7.1` / `A.8.8`). El módulo con
vida propia no entra al MVP.

### 7.5 La IA y el veredicto

La IA evalúa evidencia, sugiere una conclusión y recomendaciones; **nunca da el veredicto**. El veredicto de un test documental o manual lo da el
**consultor** (`evaluations.confirmed_by`), y si lo da con observaciones abiertas se documenta la razón (`evaluations.closure_observation_reason`).

**El consultor y el auditor evalúan el cumplimiento con distinto enfoque** (D68, D77): el consultor **prepara** a la empresa y el auditor **certifica**, cada uno sobre los mismos datos.
Cada uno emite su evaluación del servicio en `framework_assessments`, ligada a la evaluación del servicio (`service_frameworks`: servicio + marco + versión + período + fecha de corte):

```mermaid
erDiagram
    framework_assessments {
        uuid id PK
        uuid tenant_id FK
        uuid service_framework_id FK "la evaluación del servicio sobre la que opina"
        enum assessor_role "consultor|auditor"
        enum verdict "ready|not_ready (consultor) · certified|not_certified (auditor)"
        text rationale "obligatoria"
        uuid issued_by FK
        datetime issued_at
    }
    service_frameworks ||--o{ framework_assessments : "recibe"
```

- **Cada rol emite solo la suya** (`SEG-56`): el consultor, `ready`/`not_ready` («lista» o «no lista para la auditoría»); el auditor, `certified`/`not_certified`.
- **No cambia el estado calculado** (§9): se muestra al lado. La del auditor es su opinión; el estado lo mueven solo los datos medidos.
- **Inmutable una vez emitida**: para cambiarla se emite otra, y la vigente es la última de ese rol sobre esa evaluación. Se escribe en la misma transacción que la acción (`audit_logs`, D52).
- El veredicto **por test** del consultor sigue en `evaluations.confirmed_by`; este es el general.

### 7.6 Las observaciones

Lo que escriben el `auditor` y el `consultor` (§5.1) son **observaciones**, no hallazgos: un hallazgo lo detecta el sistema (§7.4) y una observación la redacta una
persona. Cada una la tiene que atender la empresa, y debe quedar constancia de que lo hizo.

```mermaid
erDiagram
    audit_observations {
        uuid id PK
        uuid tenant_id FK
        uuid service_id FK
        uuid client_control_id FK "nullable, si habla de un control"
        uuid evidence_submission_id FK "nullable, si comenta una evidencia"
        uuid created_by FK "el auditor o el consultor que la escribe"
        enum type "observation|recommendation|information_request"
        text body
        enum status "open|answered|closed"
        text answer_note "nullable, que hizo la empresa"
        uuid answer_evidence_id FK "nullable, evidencia que respalda la respuesta"
        uuid answered_by FK "nullable"
        datetime answered_at "nullable"
        uuid closed_by FK "nullable, siempre quien la escribio"
        datetime closed_at "nullable"
        datetime created_at
    }
    services ||--o{ audit_observations : "recibe"
    client_controls ||--o{ audit_observations : "puede tener"
    evidence_submissions ||--o{ audit_observations : "puede tener"
```

- **Tres tipos:** observación, recomendación y solicitud de información (pedirle más datos a la empresa).
- **Tres estados:** `open` → `answered` → `closed`. La empresa (`admin_empresa`, o el `funcional` dueño del control) **responde** dejando su nota y, si hace falta, una evidencia;
  **solo quien la escribió la cierra**. Si no queda conforme, la devuelve a `open`.
- **Una observación cerrada no se reabre**: si hace falta algo más, se crea otra. Mientras no esté cerrada, su autor puede modificarla.
- **Una observación no mueve el porcentaje.** El cumplimiento solo cambia por el camino de siempre: si la respuesta es un documento, entra como evidencia, se aprueba y
  el consultor da el veredicto del test **documental**. Si ese veredicto es negativo, el test falla y el porcentaje baja.
- **Se escribe en la misma transacción que la acción** (`audit_logs`, D52). La observación no se borra.

---
