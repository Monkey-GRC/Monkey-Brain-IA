# Roles y permisos · Flujos de información

Responde: **¿cómo llega una restricción de rol hasta lo que el usuario ve?**

## 1 · Una lectura de un `funcional`

```mermaid
sequenceDiagram
    autonumber
    participant FE as Frontend
    participant G as RolesGuard
    participant UC as Caso de uso de compliance
    participant DB as PostgreSQL
    FE->>G: GET controles de un servicio
    G->>G: ¿el rol está en @Roles? (capa 1)
    G->>UC: Principal
    UC->>DB: carga el servicio dentro de la empresa (RLS, capa 2)
    UC->>UC: si es funcional, deja solo las pruebas de sus especialidades (capa 3)
    UC-->>FE: lista; vacía si no tiene especialidad que coincida
```

Un recurso que existe pero no es suyo responde `403`; de otra empresa, `404`, para no revelar su existencia
(`contracts/conventions.md`).

## 2 · Un cambio de rol o una baja surte efecto en la siguiente petición

El rol y el estado se leen de la base en cada petición (no del token), así que desactivar a alguien o cambiarle el
rol se nota de inmediato. Es la razón del costo descrito en [`../autenticacion/06-mejoras.md`](../autenticacion/06-mejoras.md) (M1).

## Cómo verificarlo

`test/` e2e de cada módulo cubre su matriz; SEG-21 en [`seguridad/roles-permisos.md`](../../seguridad/roles-permisos.md).
