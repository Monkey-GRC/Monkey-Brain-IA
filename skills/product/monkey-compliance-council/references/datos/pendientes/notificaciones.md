# Pendientes del comité — Notificaciones

Preguntas abiertas que afectan a [Notificaciones](../../arquitectura/notificaciones/README.md). **Si una sigue aquí, no se resuelve por cuenta propia: se pregunta.** Tablero y reglas: [`README.md`](README.md).

## P39 · Notificaciones a toda la cadena de un control

**Estado:** abierto desde 2026-11-01. Héctor pide que el administrador, los `responsable` y los `delegado` reciban notificaciones y estén al tanto del cumplimiento de los controles. **No existe ningún sistema de notificaciones** (MD-69, aplazado); sí salen cinco correos transaccionales (clave de acceso D99, invitaciones D102 punto 14 y D117, contraseña D101); ver también `DT-83` (aviso de borrado) en `deuda-tecnica/notificaciones.md` y la pregunta 6 de P37).

1. **¿Entra el sistema de notificaciones en el sprint 3?** ¿Correo, en la app o los dos? ¿Con qué proveedor y plantillas?
2. **Eventos.** ¿Cuáles notifican? Control asignado o reasignado · evidencia subida, validada o rechazada · control que pasa a «no cumple» · fallo de la sonda o del motor de nube · observación del auditor · vencimiento próximo · invitación o activación de cuenta.
3. **¿Quién recibe qué?** *Propuesta:* el `admin_empresa`, de todos los controles; el `responsable`, de los suyos y los de sus delegados; el `delegado`, de los que ejecuta. ¿También el `auditor`?
4. **Frecuencia.** ¿Inmediato, resumen diario o semanal? ¿Cada persona configura sus preferencias?
5. **Centro de notificaciones en la app:** campana, leído y no leído, historial y su retención.
6. **Recordatorios de vencimiento.** Respondida por D131 (periodicidad por control y días de aviso, PR-06).
7. **Idioma y forma del texto.** ¿Siguen el i18n actual? Los textos que ve un usuario final siguen la plantilla de 7 campos (`philosophy.md`) y nunca nombran al proveedor de la sonda ni de la nube.
8. **Invitación de cuentas.** *Resuelta por D102 punto 14:* la invitación llega por correo con el código de activación (construido, SEG-75).

**Lo que respondió la VF18 (D138, D131; 2026-11-22):** los eventos y quién recibe cada uno (punto 2 y 3: ventana por vencer o vencida, check Directo en falla, evidencia automática desactualizada, control por aprobar, aprobado o devuelto, y los avisos de Documentos) y los recordatorios de vencimiento con sus días de anticipación (punto 6, PR-06). Siguen abiertos el canal, la frecuencia, el centro de notificaciones y el sprint (puntos 1, 4 y 5).

**Qué depende:** MD-69 y los avisos del módulo de usuarios. Si el comité lo deja fuera del sprint 3, queda como `LATER` y hay que decir cómo se mantiene informada a la cadena mientras tanto.


---
