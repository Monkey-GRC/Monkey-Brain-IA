# Evidencia · Flujos

> **MD-504 (2026-11-25): el flujo «2 · Revisar» se retiró.** `PUT /v1/evidence-submissions/:id/review` ya no existe; la entrega cuenta si no fue devuelta y se devuelve al devolver el control (`contracts/cumplimiento/aprobacion.md`). Solo el flujo de subir sigue vigente.

**
Responde: **¿qué pasa al subir un documento y al revisarlo?** Las dos operaciones siguen el patrón común de
escritura ([`../03-flujos.md`](../03-flujos.md)): foto antes, hecho, rastro, foto después.

## 1 · Subir una evidencia

`POST /v1/evidence-requirements/:requirementId/submissions`, o `POST /controls/:controlId/tests/:testId/evidence`,
que además crea el «lugar» de la prueba en la primera entrega (D88).

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant UC as UploadEvidenceUseCase
    participant S3 as FileStorage (S3 o minio)
    participant R as EvidencePrismaRepository
    participant DB as PostgreSQL

    FE->>UC: archivo + requirementId
    UC->>R: findRequirement: ¿existe, es de esta empresa, le toca a este usuario?
    UC->>UC: valida tipo y tamaño del archivo
    UC->>S3: put(llave, archivo)
    UC->>UC: calcula SHA-256 del contenido
    UC->>R: createSubmission(...)
    R->>DB: abre transacción con withScope
    R->>DB: captureControlStates (foto ANTES)
    R->>DB: SELECT ... FOR UPDATE sobre el requerimiento
    R->>DB: calcula la versión siguiente y crea la entrega
    R->>DB: insertAuditLog (huella y nombre, nunca el contenido)
    R->>DB: recordControlStateChanges (foto DESPUÉS)
    alt algo falla en la base
        UC->>S3: remove(llave)
    end
    R-->>UC: la entrega creada
    UC-->>FE: 201 con la versión y la huella
```

**Qué mirar**

- **El archivo se sube a S3 antes de la transacción.** Si la base falla, el caso de uso borra el archivo
  (compensación). Si el proceso muere justo en medio, queda un archivo huérfano ([`../06-mejoras.md`](../06-mejoras.md), M5).
- **La versión se calcula bajo bloqueo** (`FOR UPDATE`) para que dos subidas simultáneas no obtengan el mismo
  número. El índice único `(requerimiento, versión)` es la red de seguridad.
- **Subir no valida.** La entrega nace `pending`, y como el estado de la prueba documental es el de la entrega más
  reciente, una versión nueva devuelve la prueba a revisión. Por eso hay foto antes y después.
- **El hash SHA-256** queda guardado: es la integridad que pide un auditor.

**Cómo verificarlo**: `UploadEvidenceUseCase` y `EvidencePrismaRepository.createSubmission`.

## 2 · Revisar una evidencia

`PUT /v1/evidence-submissions/:submissionId/review` · `admin_empresa` (cualquiera) o el `responsable` dueño (lo que no subió él) (D102).

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant UC as ReviewEvidenceUseCase
    participant R as EvidencePrismaRepository
    participant DB as PostgreSQL

    FE->>UC: seis atributos (tipo, período, vigencia, aprobación, firma, contenido) + revisión + nota
    UC->>UC: si algún atributo es «no» exige nota (quien subió necesita saber qué corregir)
    UC->>R: saveReview(scope, submissionId, ...)
    R->>DB: abre transacción con withScope
    R->>DB: captureControlStates (foto ANTES)
    R->>DB: guarda la revisión (crea o reemplaza la de esta entrega)
    R->>DB: insertAuditLog (antes y después de la revisión)
    R->>DB: recordControlStateChanges (foto DESPUÉS)
    R-->>UC: la entrega con su estado calculado
    UC-->>FE: 200
```

**Qué mirar**

- **Aquí se decide `compliant`.** El estado de la evidencia lo calcula `evidenceStateOf` a partir de esta revisión
  humana. La IA puede dejarla `in_review`, nunca `compliant` (RN-03).
- **Hay una revisión por entrega y por rol** (el dueño y el `admin_empresa`); el estado combina las dos y un rechazo gana (D102). Revisar de nuevo con el mismo rol la **reemplaza**; lo que
  conserva el historial es el rastro de auditoría ([`../06-mejoras.md`](../06-mejoras.md), M4).

**Cómo verificarlo**: `ReviewEvidenceUseCase` y `EvidencePrismaRepository.saveReview`.
