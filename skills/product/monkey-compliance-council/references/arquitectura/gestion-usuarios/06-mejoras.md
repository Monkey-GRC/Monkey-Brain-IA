# Gestión de usuarios · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`. El plan del sprint 3 está en Jira (épico «Sprint 3 · Gestión de usuarios»).

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Migrar lo construido por dimensión al modelo D102 | A | L |
| M2 | Avisar a quien tiene controles antes de darlo de baja | A | M |
| M3 | Ausencias y delegación temporal | C | M |
| M4 | Reparto equitativo automático | C | S |
| M5 | Rol de soporte de Monkey | C | M |

## M1 · Rehacer lo que no cuadra
Se eliminan `user_dimensions` y `service_dimension_owners`; `user_control_assignments` se reemplaza por
`client_control_assignments`; la especialidad desaparece del contrato y de la pantalla Equipo. No hay empresas reales,
así que no hay que conservar datos.

## M2 · Controles huérfanos
Resuelto por D102: la baja pide confirmación y los controles quedan «Sin asignar»; un responsable con delegados no se
da de baja.

## M3 · Ausencias
Hoy el dueño, el ejecutor y el administrador pueden hacer lo mismo si alguien no está; la asignación es seguimiento.
Una delegación temporal con fechas sería una tabla nueva. Fuera del sprint 3.

## M4 · Reparto equitativo
Se ofrecen filtros y selección en bloque; repartir solo no se construye.

## M5 · Soporte de Monkey
Un rol interno de soporte, sin definir (D103).
