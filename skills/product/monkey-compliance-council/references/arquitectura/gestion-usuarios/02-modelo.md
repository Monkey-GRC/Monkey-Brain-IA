# Gestión de usuarios · Modelo

Responde: **¿qué tablas guardan el equipo y el reparto, y cómo se llega al responsable de una prueba?** El diagrama
ER está en [`datos/modelo/05-usuarios.md`](../../datos/modelo/05-usuarios.md) §5.2 y **no se redibuja**. Aquí solo lo
que ese archivo cuenta en prosa: la resolución del responsable.

## Resolver el responsable efectivo (no se guarda)

```mermaid
flowchart TD
    q["Par (control del cliente, dimensión)"] --> a{"¿Hay fila en<br/>user_control_assignments?"}
    a -- "sí" --> r1["Responsable = esa persona<br/>(excepción del control)"]
    a -- "no" --> b{"¿Hay fila en<br/>service_dimension_owners<br/>del servicio?"}
    b -- "sí" --> r2["Responsable = el principal<br/>del servicio en esa dimensión"]
    b -- "no" --> r3["Sin responsable<br/>(el admin_empresa lo ve señalado)"]
```

Restricciones: una fila por (servicio, dimensión) y por (control, dimensión); solo se asigna a un `funcional` con esa
especialidad; la fila apunta a `client_controls`, no al catálogo.

## Vigente por D98

El `funcional` atiende **todo** lo de sus especialidades sin asignación. La resolución de arriba se conserva en la
API y la base, pero no cambia lo que nadie ve (la interfaz del reparto está apagada, `contracts/gestion-usuarios.md`). P38 decide si
vuelve a restringir y a qué nivel.

## Cómo verificarlo

`Backend/prisma/schema/platform/users.prisma` y `control-responsibles.ts`.
