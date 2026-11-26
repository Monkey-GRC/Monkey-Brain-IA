# Notificaciones

Responde: **¿cómo se entera alguien de que tiene algo que hacer?** Por la **campana** de la app (avisos de 90 días, en
vivo), por un **resumen diario por correo** que cada persona puede apagar y por los **correos transaccionales** (cinco, los
de la tabla de abajo). Este directorio documenta lo que hay, lo que sigue reservado y qué lo bloquea.

> **Construido en MD-515 (2026-11-25).** Los eventos y destinatarios son de D138, los recordatorios de D131, el canal, la
> frecuencia y el centro de notificaciones de D143, y el funcionamiento (destinatarios, agrupación, campana en vivo y
> resumen) de D151. Contrato: [`contracts/notificaciones.md`](../../../../../../contracts/notificaciones.md); modelo:
> [`datos/modelo/12-notificaciones.md`](../../datos/modelo/12-notificaciones.md).

## La campana y el resumen diario

| Pieza | Qué hace |
|---|---|
| Avisos por persona | Cada aviso es de **una** persona (RLS por persona, SEG-87) y nace **en la misma transacción** que el hecho que lo causa. Dura 90 días |
| Canal en vivo | `GET /v1/me/notifications/stream` (Server-Sent Events) publica cada aviso confirmado; entre réplicas viaja por `LISTEN`/`NOTIFY` de Postgres (`APP_DATABASE_URL` directa); hasta 5 conexiones por persona |
| La campana en pantalla | Panel de tarjetas (ícono y color según el tipo) con el detalle encima; «Ver todas» abre `/notificaciones`, página completa fuera del shell con «Volver a la aplicación» (`/avisos` y `/notificaciones/ventana` redirigen). El punto de no leído es rojo |
| Resumen diario | Una vez al día desde las 12:00 UTC, solo con avisos sin leer y solo a quien no lo apagó (`users.is_email_digest_enabled`) |
| Emiten hoy | `window_due_soon` y `window_expired` (pasada diaria de las ventanas; los controles «Sin asignar» van agrupados en un aviso por servicio, tipo y día para los administradores), `control_assigned`, `evidence_approved` y `evidence_rejected`; desde MD-508 (D153): `direct_check_failed` (al cerrar la recolección, solo cuando un check Directo pasa a FAIL; la primera recolección del activo no avisa), `automatic_evidence_stale` (pasada diaria, un aviso por control) y `check_parameters_changed` (lo escribe la pasada por empresa, a cada `admin_empresa`, leyendo `catalog.evaluation_parameter_changes`) |
| Reservados | `observation_created`, `control_pending_approval`, `control_owner_approved`, `control_returned` (MD-504), los de Documentos (MD-506) y `company_purge_upcoming` (DT-83) |

## Qué dice cada aviso y por dónde llega

La tabla única de cada aviso (evento que lo genera, canal, título y texto) y de los correos que salen sin pasar por la campana
está en el contrato: [`contracts/notificaciones/textos.md`](../../../../../../contracts/notificaciones/textos.md).

Los cinco los manda el puerto `Mailer` ([Plataforma](../plataforma/README.md)); en producción el servidor no arranca sin
un servicio de correo real (`MAIL_PROVIDER`, SEG-71). El resumen diario de la campana sale por el mismo puerto.

## Lo que aún no avisa nadie

- **Que un control pasó a no cumplir**, que el auditor escribió una observación, que una empresa archivada está por
  borrarse: sus tipos de aviso existen pero están reservados (arriba). Se ve entrando a mirar. (La falla de un check
  Directo, la evidencia automática desactualizada y el cambio de parámetros ya avisan, D153.)

## Lo que ya está decidido

| Tema | Decisión |
|---|---|
| Eventos y quién recibe cada uno | D138: ventana por vencer o vencida, check Directo en falla, evidencia automática desactualizada, control por aprobar, aprobado o devuelto, y los avisos de Documentos |
| Canal | En la app y por correo (D143) |
| Frecuencia | En la app, al instante; por correo, resumen diario. Cada persona puede apagar el correo (D143). Construido: tarea programada (`NotificationScheduler`) |
| Centro de notificaciones | Campana con leído y no leído e historial de 90 días (D143). Construido: `notifications` y `notification_digests` |
| Recordatorios de vencimiento | Periodicidad por control y días de aviso (D131, PR-06) |

## Dos restricciones que valen para todo texto

Cualquier texto de un aviso o correo tiene reglas:

1. **Nunca se nombra al proveedor del motor** (sonda o nube): se dice «sonda» o «evaluación automática» (D70, SEG-39).
2. **Si le habla a un usuario final, sigue la plantilla de 7 campos** de `producto/philosophy.md`: qué ocurrió, por
   qué importa, cómo solucionarlo, quién, cuánto tiempo, qué evidencia y qué impacto.

## Planificador

El resumen diario y la retención de 90 días los corre `NotificationScheduler` (`NOTIFICATION_DIGEST_INTERVAL_MINUTES`,
`NOTIFICATION_DIGEST_HOUR_UTC`), idempotente entre réplicas. Es un planificador más, junto al de los períodos auditados y
al de la purga de empresas; unificarlos sigue como mejora de [`control-tecnico`](../control-tecnico/06-mejoras.md) (M1) y
[`empresas`](../empresas/06-mejoras.md) (M1).

## Dónde está cada dato

D138, D143, D151, D153 · `MD-515`, `MD-508` · D99, D101, D102 y D117 · `producto/philosophy.md` (cómo se redacta).

Registros de este módulo:

| Registro | Dónde |
|---|---|
| Decisiones (`D-n`) | [`datos/decisiones/notificaciones.md`](../../datos/decisiones/notificaciones.md): `D138`, `D143`, `D151`, `D153`; lo que sale hoy lo deciden además D99, D101, D102 y D117 ([`empresas`](../../datos/decisiones/empresas.md), [`autenticacion`](../../datos/decisiones/autenticacion.md), [`gestion-usuarios`](../../datos/decisiones/gestion-usuarios.md)) |
| Pendientes del comité (`P-n`) | [`datos/pendientes/notificaciones.md`](../../datos/pendientes/notificaciones.md): ninguno abierto (P39 la cerró D143) |
| Deuda vigente (`DT-n`) | [`deuda-tecnica/notificaciones.md`](../../deuda-tecnica/notificaciones.md): 1 ficha (`DT-83`) |
| Requisitos de seguridad (`SEG-n`) | [`seguridad/notificaciones.md`](../../seguridad/notificaciones.md): `SEG-87`. Un aviso que vea un usuario cumple además los de [`plataforma.md`](../../seguridad/plataforma.md) |

## Contenido

[`04-historias.md`](04-historias.md) · [`05-casos-de-uso.md`](05-casos-de-uso.md)
