# Notificaciones

Responde: **¿cómo se entera alguien de que tiene algo que hacer?** Hoy, **casi nunca**: no existe un sistema de
notificaciones. Este directorio documenta lo poco que hay, lo que falta y qué lo bloquea, para que nadie lo
construya a medias por su cuenta.

> **Nada de esto está construido.** Es `MD-69`, aplazado, y las preguntas abiertas de `P39`. Mientras `P39` siga
> abierta **se pregunta, no se resuelve** (`CLAUDE.md`).

## Lo único que sale hoy

| Correo | Cuándo | Decisión |
|---|---|---|
| Clave de acceso de una empresa nueva | `admin_monkey` registra la empresa, o reenvía la clave | D99 |
| Enlace de recuperación de contraseña | La persona lo pide | D101 |
| Aviso de contraseña cambiada | Después de cambiarla | D101 |

Los tres los manda el puerto `Mailer` ([Plataforma](../plataforma/README.md)). No hay centro de notificaciones en
la aplicación, ni campana, ni preferencias.

## Lo que se entrega a mano por no existir

- **El código de activación** de una cuenta nueva: viaja en claro en la respuesta de la API y el `admin_empresa`
  se lo pasa a la persona por otro canal ([Gestión de usuarios](../gestion-usuarios/README.md), M4).
- **Que un control pasó a no cumplir**, que la sonda falló, que una evidencia fue rechazada, que el auditor
  escribió una observación, que algo vence: nadie avisa. Se ve entrando a mirar.

## Lo que hay que decidir antes de construir

Está en `P39`, con ocho preguntas. Las que más condicionan el diseño:

| Pregunta | Por qué bloquea |
|---|---|
| ¿Entra en el sprint 3? ¿Correo, en la app, o los dos? | Define si hace falta una tabla de notificaciones o solo un puerto más |
| ¿Qué eventos notifican? | Hoy el único disparador fiable es `compliance_events` ([Trazabilidad](../trazabilidad/README.md)) |
| ¿Quién recibe qué? | Depende de la cadena de asignación, que es `P38` |
| ¿Frecuencia: inmediato o resumen? | Cambia por completo la arquitectura (envío directo vs. cola y planificador) |
| Recordatorios de vencimiento | Dependen de la periodicidad de los controles, abierta en `P22` punto 2 |

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

`P39` en `datos/pendientes/notificaciones.md` · `MD-69` · D99 y D101 · `producto/philosophy.md` (cómo se redacta).

Registros de este módulo:

| Registro | Dónde |
|---|---|
| Decisiones (`D-n`) | ninguna propia: lo poco que sale hoy lo deciden D99 y D101 ([`empresas`](../../datos/decisiones/empresas.md), [`autenticacion`](../../datos/decisiones/autenticacion.md)) |
| Pendientes del comité (`P-n`) | [`datos/pendientes/notificaciones.md`](../../datos/pendientes/notificaciones.md): `P39` — **si sigue abierto, se pregunta** |
| Deuda vigente (`DT-n`) | [`deuda-tecnica/notificaciones.md`](../../deuda-tecnica/notificaciones.md): 2 fichas |
| Requisitos de seguridad (`SEG-n`) | ninguno propio. Un aviso que vea un usuario cumple los de [`plataforma.md`](../../seguridad/plataforma.md) |
