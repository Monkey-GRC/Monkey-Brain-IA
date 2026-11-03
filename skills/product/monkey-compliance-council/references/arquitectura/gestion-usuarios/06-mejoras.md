# Gestión de usuarios · Mejoras

Propuestas; lo aprobado pasa a `DT-n` o a una `D-n`.

| # | Mejora | Prio | Esfuerzo |
|---|---|---|---|
| M1 | Cerrar P38 antes de tocar el reparto | A | — |
| M2 | Reasignar al desactivar a un responsable | B | M |
| M3 | Aclarar el estado real de la interfaz del reparto | A | S |
| M4 | Correo de invitación | B | M |

## M1 · No construir sobre el reparto actual
El reparto, el tercer nivel y las notificaciones dependen de `P38` y `P39`. Construir antes obliga a rehacer
(`CLAUDE.md`: si un pendiente sigue abierto, se pregunta).

## M2 · Controles huérfanos
Desactivar a un responsable no reasigna sus controles: quedan «sin responsable efectivo activo». Con tres niveles el
problema crece. Es la pregunta 14 de `P38`.

## M3 · Dos documentos dicen cosas distintas
`contracts/gestion-usuarios.md` dice que la pantalla del reparto está construida; su nota D98 y `P38` dicen que la
interfaz está apagada. Contrastarlo con `Frontend-Platform` y corregir el que esté mal.

## M4 · El código de activación se entrega a mano
Sin correo (`MD-69`, `P39`) el administrador lo copia y lo pasa por otro canal. Es seguro (un uso, vence, solo se
guarda su huella) pero poco usable.
