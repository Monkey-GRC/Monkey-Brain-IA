# Deuda técnica — Notificaciones

Parches vigentes de [Notificaciones](../arquitectura/notificaciones/README.md). Tablero y reglas: [`README.md`](README.md).

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-83 · Falta el aviso a los `admin_monkey` de que una empresa está por borrarse

🟠 Importante

- **Qué está parchado:** archivar y borrar una empresa (D97) exige avisar a todos los `admin_monkey`, al menos 3 días antes, por correo y por notificación en la app. Las notificaciones de la app existen desde MD-515, pero el tipo `company_purge_upcoming` está reservado y ningún emisor lo envía todavía; `admin_monkey` no tiene campana. El aviso es informativo y no condiciona el borrado: archivar, reactivar y la purga al vencer funcionan de punta a punta; mientras tanto Monkey Admin muestra en el listado de archivadas la fecha de borrado y los días que faltan.
- **Por qué:** el sistema de correos y de notificaciones es una funcionalidad aparte, que no bloquea el resto.
- **Qué lo cierra:** construir el correo y las notificaciones en la app, enviarlos a todos los `admin_monkey` al menos 3 días antes del vencimiento, sin tocar la purga.

### DT-128 · Los avisos `evidence_approved` y `evidence_rejected` quedan sin emisor

🟡 Mejora

- **Qué está parchado:** MD-504 retiró la revisión por evidencia (D132 punto 3), que era lo único que emitía estos dos tipos. Siguen en el enum de la base y en `notification-type.ts` como reservados, sin audiencia ni emisor; el contrato los marca «sin emisor».
- **Por qué:** quitar un valor de un enum de Postgres es destructivo y no hacía falta para la aprobación del control.
- **Qué lo cierra:** retirarlos del enum, del i18n y del contrato en un cambio de limpieza, o reutilizarlos si Documentos (MD-506) necesita avisar la aprobación de un documento.
