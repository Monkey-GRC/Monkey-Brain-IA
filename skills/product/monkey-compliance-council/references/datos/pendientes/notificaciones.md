# Pendientes del comité — Notificaciones

Preguntas abiertas que afectan a [Notificaciones](../../arquitectura/notificaciones/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P39 · Notificaciones a toda la cadena de un control

**Estado:** abierto desde 2026-11-01. Héctor pide que el administrador, los `funcional` y los responsables reciban notificaciones y estén al tanto del cumplimiento de los controles. **No existe ningún sistema de notificaciones ni de correo** (MD-69, aplazado; D99 solo cubrió la clave de acceso; ver también `DT-83` (aviso de borrado) en `deuda-tecnica/notificaciones.md` y la pregunta 6 de P37).

1. **¿Entra el sistema de notificaciones en el sprint 3?** ¿Correo, en la app o los dos? ¿Con qué proveedor y plantillas?
2. **Eventos.** ¿Cuáles notifican? Control asignado o reasignado · evidencia subida, validada o rechazada · control que pasa a «no cumple» · fallo de la sonda o del motor de nube · observación del auditor · vencimiento próximo · invitación o activación de cuenta.
3. **¿Quién recibe qué?** *Propuesta:* el `admin_empresa`, de todos los controles; el `funcional`, de los suyos y los de sus responsables; el responsable, de los suyos. ¿También el `auditor`?
4. **Frecuencia.** ¿Inmediato, resumen diario o semanal? ¿Cada persona configura sus preferencias?
5. **Centro de notificaciones en la app:** campana, leído y no leído, historial y su retención.
6. **Recordatorios de vencimiento.** Dependen de la periodicidad de los controles, que sigue abierta (P22, punto 2).
7. **Idioma y forma del texto.** ¿Siguen el i18n actual? Los textos que ve un usuario final siguen la plantilla de 7 campos (`philosophy.md`) y nunca nombran al proveedor de la sonda ni de la nube.
8. **Invitación de cuentas.** Hoy el código de activación se entrega a mano; con correo, ¿pasa a enviarse por correo (enlace o código)?

**Qué depende:** MD-69, la invitación por correo y los avisos del módulo de usuarios. Si el comité lo deja fuera del sprint 3, queda como `LATER` y hay que decir cómo se mantiene informada a la cadena mientras tanto.

---
