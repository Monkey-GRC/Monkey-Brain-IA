# Gestión de usuarios · Flujos de información

Responde: **¿cómo entra una persona al equipo y cómo se le asignan controles?** Rutas y cuerpos: `contracts/gestion-usuarios.md`.

## 1 · Invitar, activar y dar de baja

```mermaid
sequenceDiagram
    autonumber
    participant A as admin_empresa o responsable
    participant T as Feature team
    participant DB as platform.*
    participant P as Persona invitada
    participant I as Autenticación
    A->>T: invitar (correo, nombre, rol, grupo; is_internal si es delegado)
    T->>DB: comprueba max_users, crea users (pending) + user_activation_codes (HMAC) + user.create
    T-->>P: correo con el código de activación
    P->>I: activar (código)
    I->>DB: cuenta active, contraseña y sesión
    Note over A,DB: Baja: PATCH status inactive (con confirmación si tiene controles) → cierra sesiones y deja user.update (CC6.3); libera el cupo
```

Frontera entre módulos: Gestión de usuarios **entrega** el código; Autenticación lo **canjea**. El único acoplamiento
es la fila `user_activation_codes`. Un `responsable` solo crea delegados de **su** equipo (`409 RESPONSIBLE_HAS_NO_TEAM` si aún no lo ha creado); el `admin_empresa` crea a todos.

## 2 · Asignar controles

| Quién | Acción | Efecto en datos | Rastro |
|---|---|---|---|
| `admin_empresa` | Pone o cambia el dueño de uno o varios controles (a un responsable o a sí mismo) | `client_control_assignments.owner_id`; limpia `executor_id` | `control_assignment.set` |
| `responsable` | Pone o quita el ejecutor de uno o varios de sus controles (un delegado de su equipo) | `executor_id` | `control_assignment.set` |
| `admin_empresa` | Mueve un delegado a otro equipo | `users.group_id`; sus controles pierden el ejecutor | `user.update` |

Reglas: un responsable no asigna a otro responsable; el administrador no asigna directo a un delegado; un control sin fila
es «Sin asignar»; dar de baja a quien tiene controles pide confirmación.

## 3 · Quién revisa lo que se sube

Sube el ejecutor, el dueño o el `admin_empresa`. Revisa el dueño si no fue quien subió, y el `admin_empresa` siempre
puede. Con dos revisiones, aprueban los dos; un rechazo gana. Detalle en `contracts/cumplimiento/evidencia.md`.

## Cómo verificarlo

`test/equipo/equipo.e2e-spec.ts`.
