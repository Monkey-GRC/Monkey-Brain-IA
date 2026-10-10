# Modelo de datos — §10 Diagrama global

> Parte de [`modelo-datos.md`](../modelo-datos.md) (índice). **Qué responde:** Todo el modelo junto. **Léelo:** Para ver la relación entre módulos.
> Los números de sección (§) se conservan: cualquier cita a «§10» apunta aquí.

## 10. Diagrama global

```mermaid
erDiagram
    companies ||--o{ access_keys : "se accede con"
    companies ||--o{ users : "emplea"
    companies ||--|| organizations : "declara su negocio como"

    organizations ||--o{ services : "presta"
    organizations ||--o{ assets : "inventaria"
    organizations }o--o{ regulations : "sujeta a"
    organizations ||--o{ organization_responsibles : "designa"

    services }o--o{ assets : "usa"
    services ||--o{ service_trust_criteria : "contrata"
    trust_criteria ||--o{ service_trust_criteria : "contratado por"
    services ||--o{ subservice_organizations : "depende de"
    services ||--|| system_descriptions : "documentado en"
    subservice_organizations ||--o{ csocs : "debe aportar"
    services ||--o{ cuecs : "espera del usuario"

    services ||--o{ service_frameworks : "contrata"
    frameworks ||--o{ service_frameworks : "contratado en"
    frameworks ||--o{ requirements : "exige"
    requirements ||--o{ points_of_focus : "precisa"
    trust_criteria ||--o{ requirements : "clasifica"
    points_of_focus }o--o{ controls : "satisfecho por"

    risks }o--o{ causes : "originado por"
    causes }o--o{ controls : "mitigada por"
    risks ||--o{ client_risks : "plantilla de"
    causes ||--o{ client_causes : "plantilla de"
    services ||--o{ client_risks : "expuesto a"
    services ||--o{ client_causes : "tiene"
    client_risks }o--o{ client_causes : "originado por"
    client_causes }o--o{ client_controls : "mitigada por"
    client_risks ||--o{ residual_risks : "deja"
    client_risks ||--o{ risk_treatments : "se trata con"
    client_causes ||--o{ mitigations : "responde con"

    controls ||--o{ client_controls : "particularizado en"
    client_controls ||--o{ user_control_assignments : "asignado a"
    client_controls ||--o{ action_plans : "remediado con"
    controls ||--o{ control_dimensions : "se evalua en"
    controls ||--o{ control_measurements : "se califica con"
    controls ||--o{ test_plans : "se prueba segun"
    client_controls ||--o{ evidence_requirements : "exige"
    controls ||--o{ control_evidence_templates : "pide"
    evidence_templates ||--o{ control_evidence_templates : "pedida por"
    client_controls ||--o{ client_control_dimensions : "se evalua en"
    client_controls ||--o{ client_control_tests : "se verifica con"
    tests ||--o{ client_control_tests : "verifica a"
    controls }o--o{ tests : "se verifica con"
    controls }o--o{ policies : "depende de"

    tests }o--o{ checks : "ejecuta"
    tests ||--o{ exclusions : "excluye"
    tests ||--o{ evaluations : "aplicado en"
    checks ||--o{ evaluations : "aplicado en"
    monitoring_domains }o--o{ requirements : "cubre"
    monitoring_domains }o--o{ automated_capabilities : "se apoya en"
    checks ||--o{ check_mappings : "mapea a"
    sca_policies ||--o{ checks : "contiene"
    evidence_requirements ||--o{ evidence_submissions : "se cumple con"

    assets ||--o{ asset_provisionings : "se prepara con"
    automated_capabilities ||--o{ asset_provisionings : "habilita"
    schedule_rules ||--o{ executions : "programa"
    assets ||--o{ executions : "se corre sobre"
    executions ||--o{ check_results : "produce"
    executions ||--o{ execution_logs : "registra"
    checks ||--o{ check_results : "evaluado como"

    services ||--o{ evaluations : "evaluado en"
    client_controls ||--o{ evaluations : "registra"
    assets ||--o{ evaluations : "sobre"
    catalog_versions ||--o{ evaluations : "medida contra"
    evaluations ||--o{ findings : "detecta"
    assets ||--o{ vulnerabilities : "expone"
```
