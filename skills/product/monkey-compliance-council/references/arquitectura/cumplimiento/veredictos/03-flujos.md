# Veredictos · Flujos

Responde: **¿qué pasa al dar un veredicto sobre una prueba manual?**

`POST /v1/controls/:controlId/tests/:testId/verdicts` · **solo `admin_empresa`** (D96).

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant C as VerdictsController
    participant UC as IssueVerdictUseCase
    participant R as TestVerdictPrismaRepository
    participant DB as PostgreSQL
    participant E as captureControlStates y recordControlStateChanges

    FE->>C: POST veredicto (cumple o no, nota)
    C->>UC: execute(principal, controlId, testId, dto)
    UC->>R: issue(scope, ..., construye AuditEntry)
    R->>DB: abre transacción con withScope
    R->>DB: ¿existe la prueba en el control? ¿el control sigue vigente?
    R->>R: rechaza si la prueba es documental (409) o automática (409)
    R->>DB: ¿hay observaciones abiertas del auditor? si sí, exige motivo de cierre
    R->>DB: busca todos los controles del servicio que llevan esta prueba y los activos de su dimensión
    R->>E: captureControlStates (foto ANTES)
    R->>DB: crea una evaluación por cada control × activo, con la misma hora
    R->>DB: lee la foto DESPUÉS para devolver el estado de la prueba
    R->>DB: insertAuditLog (rastro de auditoría)
    R->>E: recordControlStateChanges (foto DESPUÉS, compara, escribe eventos)
    E->>DB: un evento control.state por cada control que cambió
    R-->>UC: el veredicto con el estado de la prueba
    UC-->>C: VerdictIssued
    C-->>FE: 201 con el veredicto
```

## Qué mirar

- **Un veredicto es del test en el servicio, no del control** (D85). Por eso se crean varias filas (control × activo)
  con **la misma hora**.
- **Todo en una transacción.** Evaluaciones, rastro de auditoría y eventos se confirman juntos o ninguno. Si el
  rastro falla, el veredicto no existe (D52).
- **Nada se pisa.** Un veredicto nuevo agrega filas nuevas; el estado actual es «la más reciente».
- **Antes y después** (pasos 9 y 13): como el estado se deriva, para saber *si cambió* hay que comparar dos fotos
  del servicio. Es el patrón de D91, común a todas las escrituras.
- Si el control lleva observaciones abiertas, el veredicto **se permite pero exige explicar por qué** (MD-154).

## Cómo verificarlo

`TestVerdictPrismaRepository.issue`.
