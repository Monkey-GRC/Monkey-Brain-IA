# Deuda técnica — Notificaciones

Parches vigentes de [Notificaciones](../arquitectura/notificaciones/README.md). Tablero y reglas: [`README.md`](README.md).

## Componente 3 — Control Técnico (D46)

### DT-10 · La UI promete «te avisaremos» cuando la evaluación automática esté disponible, y no existe ningún aviso

🟠 Importante

- **Qué está parchado:** (ni correo ni notificación)
- **Por qué:** Mensaje honesto para el modo `unavailable`
- **Qué lo cierra:** Construir las notificaciones **o** reescribir el mensaje. No dejar la promesa sin mecanismo

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-83 · Falta el aviso a los `admin_monkey` de que una empresa está por borrarse

🟠 Importante

- **Qué está parchado:** archivar y borrar una empresa (D97) exige avisar a todos los `admin_monkey`, al menos 3 días antes, por correo y por notificación en la app. Ni el correo (MD-69) ni las notificaciones existen. El aviso es informativo y no condiciona el borrado: archivar, reactivar y la purga al vencer funcionan de punta a punta; mientras tanto Monkey Admin muestra en el listado de archivadas la fecha de borrado y los días que faltan.
- **Por qué:** el sistema de correos y de notificaciones es una funcionalidad aparte, que no bloquea el resto.
- **Qué lo cierra:** construir el correo y las notificaciones en la app, enviarlos a todos los `admin_monkey` al menos 3 días antes del vencimiento, sin tocar la purga.
