# Gestión de usuarios · Flujos de información

Responde: **¿cómo entra una persona al equipo y cómo se reparte el trabajo?** Rutas y cuerpos: `contracts/gestion-usuarios.md`.

## 1 · Invitar, activar y dar de baja

```mermaid
sequenceDiagram
    autonumber
    participant A as admin_empresa
    participant T as Feature team
    participant DB as platform.*
    participant P as Persona invitada
    participant I as Autenticación
    A->>T: invitar (correo, rol, especialidades si es funcional)
    T->>DB: users (pending) + user_dimensions + user_activation_codes (HMAC) + user.create
    T-->>A: código en claro, solo en esta respuesta
    A->>P: lo entrega por su cuenta (sin correo aún)
    P->>I: activar (código)
    I->>DB: cuenta active, contraseña y sesión
    Note over A,DB: Baja: PATCH status inactive → T cierra sus sesiones y deja user.update (CC6.3)
```

Frontera entre módulos: Gestión de usuarios **entrega** el código; Autenticación lo **canjea**. El único acoplamiento
es la fila `user_activation_codes`.

## 2 · Repartir el trabajo

| Quién | Acción | Efecto en datos | Rastro |
|---|---|---|---|
| `admin_empresa` | Asigna el responsable principal de una dimensión en un servicio | `service_dimension_owners` | `dimension_owner.set` |
| `admin_empresa` | Fija o quita la excepción de un control | `user_control_assignments` | `control_responsible.set` |
| `admin_empresa` | Cambia las especialidades de un `funcional` | `user_dimensions` | `user.update` |

Reglas: solo a un `funcional` con esa especialidad; no se quita una especialidad mientras la persona sea responsable
de algo; desactivar a un responsable **no** lo reasigna.

## Cómo verificarlo

`test/equipo/equipo.e2e-spec.ts`.
