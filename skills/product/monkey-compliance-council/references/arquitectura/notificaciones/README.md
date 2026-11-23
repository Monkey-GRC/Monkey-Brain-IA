# Notificaciones

Responde: **¿cómo se entera alguien de que tiene algo que hacer?** Hoy solo por **correos transaccionales** (cinco, los de
la tabla de abajo): no existe un sistema de notificaciones. Este directorio documenta lo que hay, lo que falta y qué lo
bloquea, para que nadie lo construya a medias por su cuenta.

> **El sistema de notificaciones no está construido**, pero ya está decidido: los eventos y destinatarios en D138, los
> recordatorios en D131 y el canal, la frecuencia y el centro de notificaciones en D143. Se construye en `MD-69`.

## Lo único que sale hoy

| Correo | Cuándo | Decisión |
|---|---|---|
| Clave de acceso de una empresa nueva | `admin_monkey` registra la empresa, o reenvía la clave | D99 |
| Enlace de recuperación de contraseña | La persona lo pide | D101 |
| Aviso de contraseña cambiada | Después de cambiarla | D101 |
| Invitación con el código de activación de una cuenta de empresa | Alguien crea o reenvía la invitación de un `responsable`, `delegado`, `auditor` o `admin_empresa` | D102 punto 14, SEG-75 |
| Invitación a Monkey Admin | Un `admin_monkey` invita a otro | D117 |

Los cinco los manda el puerto `Mailer` ([Plataforma](../plataforma/README.md)); en producción el servidor no arranca sin
un servicio de correo real (`MAIL_PROVIDER`, SEG-71). No hay centro de notificaciones en la aplicación, ni campana, ni
preferencias.

## Lo que no avisa nadie

- **Que un control pasó a no cumplir**, que la sonda falló, que una evidencia fue rechazada, que el auditor
  escribió una observación, que algo vence: nadie avisa. Se ve entrando a mirar.

## Lo que ya está decidido

| Tema | Decisión |
|---|---|
| Eventos y quién recibe cada uno | D138: ventana por vencer o vencida, check Directo en falla, evidencia automática desactualizada, control por aprobar, aprobado o devuelto, y los avisos de Documentos |
| Canal | En la app y por correo (D143) |
| Frecuencia | En la app, al instante; por correo, resumen diario. Cada persona puede apagar el correo (D143). Necesita cola y planificador |
| Centro de notificaciones | Campana con leído y no leído e historial de 90 días (D143). Necesita una tabla de notificaciones |
| Recordatorios de vencimiento | Periodicidad por control y días de aviso (D131, PR-06) |

## Dos restricciones que ya valen

Aunque no esté construido, cualquier texto que se escriba **ya tiene reglas**:

1. **Nunca se nombra al proveedor del motor** (sonda o nube): se dice «sonda» o «evaluación automática» (D70, SEG-39).
2. **Si le habla a un usuario final, sigue la plantilla de 7 campos** de `producto/philosophy.md`: qué ocurrió, por
   qué importa, cómo solucionarlo, quién, cuánto tiempo, qué evidencia y qué impacto.

## Dependencia técnica que falta

Un envío por frecuencia («resumen diario») necesita un **planificador**, que hoy no existe: el mismo hueco que
tienen las ejecuciones programadas ([`control-tecnico/06-mejoras.md`](../control-tecnico/06-mejoras.md), M1) y la
purga de empresas ([`empresas/06-mejoras.md`](../empresas/06-mejoras.md), M1). Conviene resolver los tres con un
solo mecanismo.

## Dónde está cada dato

D138, D143 · `MD-69` · D99, D101, D102 y D117 · `producto/philosophy.md` (cómo se redacta).

Registros de este módulo:

| Registro | Dónde |
|---|---|
| Decisiones (`D-n`) | [`datos/decisiones/notificaciones.md`](../../datos/decisiones/notificaciones.md): `D138`; lo que sale hoy lo deciden además D99, D101, D102 y D117 ([`empresas`](../../datos/decisiones/empresas.md), [`autenticacion`](../../datos/decisiones/autenticacion.md), [`gestion-usuarios`](../../datos/decisiones/gestion-usuarios.md)) |
| Pendientes del comité (`P-n`) | [`datos/pendientes/notificaciones.md`](../../datos/pendientes/notificaciones.md): ninguno abierto (P39 la cerró D143) |
| Deuda vigente (`DT-n`) | [`deuda-tecnica/notificaciones.md`](../../deuda-tecnica/notificaciones.md): 1 ficha (`DT-83`) |
| Requisitos de seguridad (`SEG-n`) | ninguno propio. Un aviso que vea un usuario cumple los de [`plataforma.md`](../../seguridad/plataforma.md) |

## Contenido

[`04-historias.md`](04-historias.md) · [`05-casos-de-uso.md`](05-casos-de-uso.md)
