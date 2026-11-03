# Deuda técnica — Trazabilidad

Parches vigentes de [Trazabilidad](../arquitectura/trazabilidad/README.md). Tablero y reglas: [`README.md`](README.md).

## Transversal

### DT-29 · `auth.login_failed` se guarda con `tenant_id` nulo

🟡 Mejora

- **Qué está parchado:** (no se sabe de qué empresa es un intento fallido hasta autenticar) y los nombres de acción siguen `<recurso>.<verbo>` salvo este
- **Por qué:** El email inexistente no identifica empresa
- **Qué lo cierra:** Decidir con Héctor si se resuelve el tenant por email cuando existe

### DT-47 · Los cierres automáticos de sesión no dejan rastro

🟡 Mejora

- **Qué está parchado:** Cuando el sistema cierra una sesión por inactividad (30 min), expiración (8 h) o usuario inactivo, no se escribe en `audit_logs`; solo se auditan el login y el logout que pide el usuario (D52). CC7.2 podría pedirlos
- **Por qué:** Son frecuentes y no son una acción del usuario; el comité no los ha pedido
- **Qué lo cierra:** Decidir con el comité si se registran (`SessionRepository.revoke` ya acepta una `AuditIntent`; hoy se pasa `null`)

## Funcionalidad que el brain menciona y aún no tiene contrato

### DT-79 · Solo algunas escrituras dejan el evento de cambio de estado de un control

🟠 Importante

- **Qué está parchado:** el evento `control.state` (D91) lo escriben el veredicto de un test manual, la entrega y la revisión de una evidencia, aprobar una exclusión y lo que mide la sonda. **No lo escriben** otras escrituras que también pueden mover el estado de un control: conectar, dar de baja o reactivar un activo (cambia el universo de sus pruebas), desactivar un test, dar de baja un control o decidir un cambio de control (MD-156, aún sin construir), y el **vencimiento** de una exclusión, que se deriva al leer (`DT-72`).
- **Por qué:** cada escritura tiene que tomar la foto de antes y llamar a `recordControlStateChanges`; se cableó en las que el ticket construía. Los activos viven en otra feature (`technical-control`) y el vencimiento no tiene un proceso que lo escriba.
- **Qué lo cierra:** llamar al mismo registrador desde cada una de esas escrituras (con su causa) y, para el vencimiento, el proceso diario de `DT-72`. Mientras tanto el historial de un control puede omitir un cambio causado por una de ellas; el estado que se muestra siempre es el correcto porque se deriva.
