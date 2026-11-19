# Empresas · Flujos

Responde: **¿qué pasa al registrar, archivar y purgar una empresa?**

## 1 · Registrar

```mermaid
sequenceDiagram
    autonumber
    participant A as admin_monkey
    participant UC as RegisterCompanyUseCase
    participant DB as PostgreSQL
    participant M as Mailer
    A->>UC: POST /v1/companies (nombre, correo del admin, marcos)
    UC->>UC: ¿base dedicada? se rechaza: no está construida
    UC->>DB: ¿el nombre o el correo ya están usados?
    UC->>UC: valida los marcos: solo los contratables (hoy SOC 2)
    UC->>DB: crea empresa + marcos + clave de acceso (solo el hash) + auditoría
    UC->>M: envía la clave al correo del administrador
    UC-->>A: la empresa y el estado del envío; la clave NO vuelve en la respuesta
```

**Qué mirar**

- **Tres campos basta**: razón social, si requiere base dedicada y el correo administrativo.
- **Un marco que no está en el catálogo no es opción**; uno `coming_soon` se ofrece como gancho comercial pero no
  se puede contratar (D50).
- **Si el correo no sale, la empresa queda creada.** `POST /v1/companies/:id/access-key/regenerate` anula la clave
  pendiente y manda otra.
- A partir de aquí el cliente sigue en [Autenticación](../autenticacion/03-flujos.md): canjea la clave y crea su
  contraseña.

## 2 · El ciclo de vida completo

```mermaid
stateDiagram-v2
    [*] --> active: registro
    active --> deactivated: baja con motivo y plazo de archivo
    deactivated --> active: alta; se vacían los datos de baja
    deactivated --> purgada: vencido archive_until
    purgada --> [*]
```

Al desactivar se toma una **copia cifrada** y se guarda dónde quedó (`archive_snapshot_key`). `GET /v1/companies/pending-purge`
lista las que ya cumplieron su plazo y `PurgeExpiredCompanies` las elimina dejando `company_purge_log`.

## 3 · Quién dispara la purga

`CompanyPurgeScheduler` (`Backend/src/features/companies/infrastructure/company-purge.scheduler.ts`) la corre sola cada
`COMPANY_PURGE_INTERVAL_MINUTES` (60 por defecto; `0` la apaga, como en las pruebas) y evita dos barridos a la vez en la
misma instancia. Con varias instancias, cada empresa se borra con su propio candado: la réplica que llega tarde la salta.

## Qué se audita

| `action` | Cuándo |
|---|---|
| `company.create` | Se registra la empresa |
| `access_key.regenerate` | Se reenvía la clave |
| `company.deactivate` · `company.reactivate` | Baja y alta |
| `company.purge` | Se borran los datos, con constancia en `company_purge_log` |

## Cómo verificarlo

`Backend/src/features/companies/application/use-cases/` y `contracts/empresas.md`.
