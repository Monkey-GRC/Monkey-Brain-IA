# Deuda técnica — Empresas

Parches vigentes de [Empresas](../arquitectura/empresas/README.md). Tablero y reglas: [`README.md`](README.md).

## Registro de empresa, contrato de marcos (D47) y activación de la cuenta (D51)

### DT-26 · Los marcos se contratan solo al registrar la empresa

🟠 Importante

- **Qué está parchado:** No hay forma de añadir, pausar o cancelar un marco **después** (ni endpoint ni pantalla), ni historial del contrato. Una empresa que ya existía antes de la migración 26 **no tiene contrato** y no podría declarar servicios (no se rellenó hacia atrás: no había datos)
- **Por qué:** Hoy solo existe SOC 2 (los otros seis se ofrecen pero no se pueden contratar, D50)
- **Qué lo cierra:** `PATCH` / pantalla de «Marcos» en Monkey Admin cuando haya un segundo marco (Fase 1) y una regla para el histórico

### DT-27 · El contrato guarda solo el marco y la fecha

🟡 Mejora

- **Qué está parchado:** (sin vigencia, precio ni condiciones comerciales) y se contrata la **versión vigente** del marco al registrar
- **Por qué:** El brain no define el contrato comercial
- **Qué lo cierra:** Definirlo con el comité si el contrato debe llevar más

### DT-41 · «Contactar a mercadeo» es un mock

🟡 Mejora

- **Qué está parchado:** El modal de un marco no contratado (Monkey Platform) invita a hablar con mercadeo, pero el botón solo cierra el modal: no hay formulario, correo ni registro de interés
- **Por qué:** El comité pidió un mock por ahora
- **Qué lo cierra:** Un canal real (formulario que llegue a ventas, con la empresa y el marco de interés)

## Transversal

### DT-22 · Base de datos dedicada → «no disponible»

🟠 Importante

- **Qué está parchado:** ; sin regenerar clave ni editar empresa
- **Por qué:** P2(b)(c)(d)
- **Qué lo cierra:** Respuestas del comité y el aprovisionamiento

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-85 · La clave de acceso viaja en claro por un servicio de correo externo y el resultado del envío no se guarda

🟠 Importante

- **Qué está parchado:** D99 envía la clave al `admin_email` por correo. (1) El mensaje lleva la clave en claro y pasa por el servicio de correo y por el buzón del cliente: es el canal de entrega, pero la clave es de un solo uso y vence a los 7 días, no más fuerte que eso. (2) El envío es directo, sin cola ni reintentos: si el servicio falla, `admin_monkey` ve «no se pudo enviar» y reenvía a mano. (3) `delivery_status` solo viaja en la respuesta; el listado de empresas no muestra que el último envío falló.
- **Por qué:** es lo mínimo para cerrar MD-69 sin construir un sistema de notificaciones.
- **Qué lo cierra:** una cola de envíos con reintentos y su estado guardado, la clave entregada como enlace de un solo uso en vez de texto, y el estado del último envío en el listado. Entra junto con DT-83 (aviso de borrado) cuando exista el sistema de correo y notificaciones.
